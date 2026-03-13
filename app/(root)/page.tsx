import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import { db } from "@/database/drizzle";
import { books, users } from "@/database/schema";
import { auth } from "@/auth";
import { desc, eq } from "drizzle-orm";
import { getUserSavedBookIds } from "@/lib/actions/book";
import { getAiEnhancedRecommendations } from "@/lib/recommendations";
import { getAiTrendingBooks } from "@/lib/trending-books";

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
  // Uses AI (GPT-4o-mini) first; falls back to existing logic automatically
  const recommendedBooks = userId
    ? await getAiEnhancedRecommendations(userId)
    : [];

  // Preferred genres for personalised trending
  let preferredGenres: string[] = [];
  if (userId) {
    const [userData] = await db
      .select({ preferredGenres: users.preferredGenres })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (userData?.preferredGenres) {
      try {
        preferredGenres = JSON.parse(userData.preferredGenres);
      } catch {
        // ignore malformed JSON
      }
    }
  }

  // AI-ranked trending books; falls back to borrow-count logic automatically
  const trendingBooks = await getAiTrendingBooks(
    recommendedBooks.map((book) => book.id),
    preferredGenres,
    6
  );

  // Saved book IDs for the current user
  const savedIds = userId ? await getUserSavedBookIds(userId) : [];

  const firstSection = 'mt-28';
  const secondSection = 'mt-16';
  const thirdSection = 'mt-16';

  return (
    <>
      <BookOverview {...latestBooks[0]} userId={userId || ''} />

      {recommendedBooks.length > 0 && (
        <BookList
          title="Recommended For You"
          books={recommendedBooks}
          containerClassName={firstSection}
          listClassName="mt-10 flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-dark-300 scrollbar-thumb-green-500"
          userId={userId}
          savedBookIds={savedIds}
        />
      )}

      {trendingBooks.length > 0 && (
        <BookList
          title={recommendedBooks.length > 0 ? "Trending Now" : "Popular Books"}
          books={trendingBooks}
          containerClassName={recommendedBooks.length > 0 ? secondSection : firstSection}
          userId={userId}
          savedBookIds={savedIds}
        />
      )}

      <BookList
        title="Latest Additions"
        books={latestBooks.slice(1)}
        containerClassName={
          recommendedBooks.length > 0 && trendingBooks.length > 0 
            ? thirdSection 
            : (recommendedBooks.length > 0 || trendingBooks.length > 0) 
              ? secondSection 
              : firstSection
        }
        userId={userId}
        savedBookIds={savedIds}
      />
    </>
  );
};

export default Home;
