import React from "react";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BookOverview from "@/components/BookOverview";
import BookVideo from "@/components/BookVideo";
import BookList from "@/components/BookList";
import AiBookSummary from "@/components/AiBookSummary";
import { getAiSimilarBooks, getBorrowedBookIds } from "@/lib/book-match";
import { getUserSavedBookIds } from "@/lib/actions/book";

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

  // Exclude books the user already borrowed from similar-book results
  const [excludeBookIds, savedIds] = await Promise.all([
    session?.user?.id ? getBorrowedBookIds(session.user.id) : Promise.resolve([]),
    session?.user?.id ? getUserSavedBookIds(session.user.id) : Promise.resolve([]),
  ]);

  // AI-powered similar books with automatic fallback to genre-based logic
  const similarBooks = await getAiSimilarBooks(
    {
      id: bookDetails.id,
      title: bookDetails.title,
      author: bookDetails.author,
      genre: bookDetails.genre,
      description: bookDetails.description,
    },
    excludeBookIds,
    5
  );

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

          <section className="mt-10">
            <AiBookSummary
              title={bookDetails.title}
              author={bookDetails.author}
              description={bookDetails.description}
            />
          </section>
        </div>

        {/* Similar Books */}
        <div className="flex-1">
          <BookList
            title="Similar Books"
            books={similarBooks}
            containerClassName="sticky top-6"
            listClassName="mt-10 ml-5 grid grid-cols-2 gap-5"
            userId={session?.user?.id}
            savedBookIds={savedIds}
          />
        </div>
      </div>
    </>
  );
};
export default Page;
