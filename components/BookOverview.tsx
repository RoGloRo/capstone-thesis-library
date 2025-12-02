import React from "react";
import Image from "next/image";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import BorrowBook from "@/components/BorrowBook";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

interface Props extends Book {
  userId: string;
}
const BookOverview = async ({
  title,
  author,
  genre,
  rating,
  totalCopies,
  availableCopies,
  description,
  coverColor,
  coverUrl,
  id,
  userId,
}: Props) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const borrowingEligibility = {
    isEligible: availableCopies > 0 && user?.status === "APPROVED",
    message:
      availableCopies <= 0
        ? "Book is not available. Out of copies"
        : "You are not eligible to borrow this book. Wait for the admin to approve your account",
  };
  return (
    <section className="book-overview">
      <div className="flex flex-1 flex-col gap-5">
        <Link href={`/books/${id}`} className="hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-bold text-white hover:underline">{title}</h1>
        </Link>

        <div className="book-info">
          <p>
            By{" "}
            <Link 
              href={`/library?author=${encodeURIComponent(author)}`}
              className="font-semibold text-light-200 hover:underline hover:opacity-90 transition-opacity"
            >
              {author}
            </Link>
          </p>

          <p>
            Category{" "}
            <Link 
              href={`/library?genre=${encodeURIComponent(genre)}`}
              className="font-semibold text-light-200 hover:underline hover:opacity-90 transition-opacity"
            >
              {genre}
            </Link>
          </p>

          <div className="flex flex-row gap-1">
            <Image
            src="/icons/star.svg"
            alt="Star"
            width={24}  // Set both width and height
            height={24}
            // OR use style to maintain aspect ratio
            // style={{ width: 'auto', height: 'auto' }}
          />
            <p>{rating}</p>
          </div>
        </div>

        <div className="book-copies">
          <p>
            Total Books <span>{totalCopies}</span>
          </p>

          <p>
            Available Books <span>{availableCopies}</span>
          </p>
        </div>

        <p className="book-description">{description}</p>

        {user && (
          <BorrowBook
            bookId={id}
            userId={userId}
            borrowingEligibility={borrowingEligibility}
          />
        )}
      </div>

      <div className="relative flex flex-1 justify-center">
        <div className="relative">
          <Link href={`/books/${id}`} className="block hover:opacity-90 transition-opacity">
            <BookCover
              variant="wide"
              className="z-10"
              coverColor={coverColor}
              coverImage={coverUrl}
            />
          </Link>

          <div className="absolute left-16 top-10 rotate-12 opacity-40 max-sm:hidden">
            <Link href={`/books/${id}`} className="block">
              <BookCover
                variant="wide"
                coverColor={coverColor}
                coverImage={coverUrl}
                className=""
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookOverview;
