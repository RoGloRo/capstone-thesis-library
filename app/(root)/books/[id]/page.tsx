import React from "react";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq, and, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BookOverview from "@/components/BookOverview";
import BookVideo from "@/components/BookVideo";
import BookList from "@/components/BookList";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  // Fetch data based on id
  const [bookDetails] = await db
    .select()
    .from(books)
    .where(eq(books.id, id))
    .limit(1);

  if (!bookDetails) redirect("/404");

  // Fetch similar books (same genre, excluding the current book)
  const similarBooks = await db
    .select()
    .from(books)
    .where(
      and(
        eq(books.genre, bookDetails.genre),
        ne(books.id, bookDetails.id) // Exclude the current book
      )
    )
    .limit(4); // Limit to 4 similar books

  return (
    <>
      <BookOverview {...bookDetails} userId={session?.user?.id as string} />

      <div className="book-details">
        <div className="flex-[1.5]">
          <section className="flex flex-col gap-7">
            <h3>Trailer</h3>

            <BookVideo videoUrl={bookDetails.videoUrl} />
          </section>
          <section className="mt-10 flex flex-col gap-7">
            <h3>Summary</h3>

            <div className="space-y-5 text-xl text-light-100">
              {bookDetails.summary.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>
        </div>

        {/* Similar Books */}
        <div className="flex-1">
          <BookList 
            title="Similar Books" 
            books={similarBooks} 
            containerClassName="sticky top-6"
          />
        </div>
      </div>
    </>
  );
};
export default Page;
