import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { auth } from "@/auth";
import { and, desc, eq, inArray, not, sql, gt } from "drizzle-orm";
import type { Book } from "@/types";

const getRecommendedBooks = async (userId: string) => {
  // Get the genres of books the user has borrowed
  const borrowedBooks = await db
    .select({
      genre: books.genre,
      borrowedBookId: books.id
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.userId, userId),
        eq(borrowRecords.status, 'BORROWED')
      )
    );

  if (borrowedBooks.length === 0) {
    // If user hasn't borrowed any books, return empty array
    return [];
  }

  // Extract all unique genres from borrowed books
  const genres = Array.from(new Set(borrowedBooks.map(book => book.genre)));
  const borrowedBookIds = borrowedBooks.map(book => book.borrowedBookId);

  // Find books in the same genres that the user hasn't borrowed
  const recommendedBooks = (await db
    .select()
    .from(books)
    .where(
      and(
        inArray(books.genre, genres),
        not(inArray(books.id, borrowedBookIds)),
        gt(books.availableCopies, 0)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(6)) as unknown as Book[];

  return recommendedBooks;
};

const Home = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  // Get the latest books
  const latestBooks = (await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt))
    .limit(10)) as unknown as Book[];

  // Get recommended books if user is logged in
  const recommendedBooks = userId 
    ? await getRecommendedBooks(userId) 
    : [];

  return (
    <>
      <BookOverview {...latestBooks[0]} userId={userId || ''} />

      {recommendedBooks.length > 0 && (
        <BookList
          title="Recommended For You"
          books={recommendedBooks}
          containerClassName="mt-28"
        />
      )}

      <BookList
        title="Latest Books"
        books={latestBooks.slice(1)}
        containerClassName={recommendedBooks.length > 0 ? 'mt-16' : 'mt-28'}
      />
    </>
  );
};

export default Home;
