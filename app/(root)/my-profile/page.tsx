import { signOut, auth } from "@/auth";
import BookList from "@/components/BookList";
import { Button } from "@/components/ui/button";
import React from "react";
import { db } from "@/database/drizzle";
import { borrowRecords, books } from "@/database/schema";
import { eq, and } from "drizzle-orm";


const Page = async () => {
  const session = await auth();

  // If no session, show nothing (or redirect to sign-in as desired)
  if (!session?.user?.id) {
    return (
      <>
        <form action={async () => {
          "use server";
          await signOut();
        }} className="mb-10">
          <Button>Logout</Button>
        </form>

        <p className="text-light-100">Please sign in to view your profile.</p>
      </>
    );
  }

  // Fetch borrowed books for the current user where status = 'BORROWED'
  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      rating: books.rating,
      totalCopies: books.totalCopies,
      availableCopies: books.availableCopies,
      description: books.description,
      coverUrl: books.coverUrl,
      coverColor: books.coverColor,
      videoUrl: books.videoUrl,
      summary: books.summary,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      borrowStatus: borrowRecords.status,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.userId, session.user.id as string),
        eq(borrowRecords.status, "BORROWED")
      )
    );

  const borrowedBooks = rows.map((r) => ({
    id: (r.id ?? "") as string,
    title: (r.title ?? "") as string,
    author: (r.author ?? "") as string,
    genre: (r.genre ?? "") as string,
    rating: Number(r.rating ?? 0),
    totalCopies: Number(r.totalCopies ?? 1),
    availableCopies: Number(r.availableCopies ?? 0),
    description: (r.description ?? "") as string,
    coverUrl: (r.coverUrl ?? "") as string,
    coverColor: (r.coverColor ?? "#ffffff") as string,
    videoUrl: (r.videoUrl ?? "") as string,
    summary: (r.summary ?? "") as string,
    borrowDate: r.borrowDate ? new Date(r.borrowDate).toISOString() : undefined,
    dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : undefined,
    returnDate: r.returnDate ? new Date(r.returnDate).toISOString() : null,
    isLoanedBook: true,
  }));

  return (
    <>
      <form action={async () => {
        "use server";

        await signOut();
      }} className="mb-10">
        <Button>Logout</Button>
      </form>

      <BookList title="Borrowed Books" books={borrowedBooks} />
    </>
  );
};

export default Page;