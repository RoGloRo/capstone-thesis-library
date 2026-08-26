import React from "react";
import Image from "next/image";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import BorrowBook from "@/components/BorrowBook";
import { db } from "@/database/drizzle";
import { users, borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";
import { ReturnBookButton } from "./ReturnBookButton";
import { and } from "drizzle-orm";
import { getUserSavedBookIds } from "@/lib/actions/book";
import SaveBookButton from "./SaveBookButton";

interface Props extends Book {
  userId: string;
}

type MetadataRow = { label: string; value: string };

/** True only when a field contains visible, non-blank text. */
const hasText = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** Builds a display row, or null when the field has no value. */
const toMetadataRow = (
  label: string,
  value: string | number | null | undefined
): MetadataRow | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? { label, value: String(value) } : null;
  }
  return hasText(value) ? { label, value: value.trim() } : null;
};

/**
 * Formats an ISO calendar date (YYYY-MM-DD) like "August 15, 2026".
 * Parts are parsed straight from the string and rebuilt as a local-time
 * Date, so timezone conversion can never shift the displayed day.
 */
const formatAcquisitionDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return value;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

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
  publishedYear,
  identifier,
  publisher,
  edition,
  language,
  pages,
  controlNumber,
  shelfLocation,
  bookFormat,
  acquisitionDate,
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
  // Add this function before the return statement
const checkIfUserHasBorrowedBook = async (userId: string, bookId: string) => {
  try {
    const [record] = await db
      .select({ id: borrowRecords.id })
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, userId),
          eq(borrowRecords.bookId, bookId),
          eq(borrowRecords.status, "BORROWED")
        )
      )
      .limit(1);
    return !!record;
  } catch (error) {
    console.error("Error checking if user has borrowed book:", error);
    return false;
  }
};

// Then call it in the component
const hasBorrowedBook = await checkIfUserHasBorrowedBook(userId, id);
const savedIds = userId ? await getUserSavedBookIds(userId) : [];
const isSaved = savedIds.includes(id);

  // Public catalog metadata. Rows without a value are omitted, and a
  // section with no rows at all is not rendered.
  const bibliographicRows = [
    toMetadataRow("ISSN / ISBN", identifier),
    toMetadataRow("Publisher", publisher),
    toMetadataRow("Edition", edition),
    toMetadataRow("Language", language),
    toMetadataRow("Pages", pages),
  ].filter((row): row is MetadataRow => row !== null);

  const libraryRows = [
    toMetadataRow("Call Number", controlNumber),
    toMetadataRow("Shelf Location", shelfLocation),
    toMetadataRow("Book Format", bookFormat),
    toMetadataRow(
      "Acquisition Date",
      hasText(acquisitionDate) ? formatAcquisitionDate(acquisitionDate) : null
    ),
  ].filter((row): row is MetadataRow => row !== null);

  return (
    <section className="w-full">
    <div className="book-overview">
      <div className="flex flex-1 flex-col gap-5 w-full min-w-0">
        <div className="flex items-start gap-3">
          <Link href={`/books/${id}`} className="hover:opacity-80 transition-opacity flex-1">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold hover:underline">{title}</h1>
          </Link>
          {user && (
            <SaveBookButton
              userId={userId}
              bookId={id}
              initialIsSaved={isSaved}
              className="mt-1 h-9 w-9 bg-white/70 hover:bg-white border border-line rounded-full shrink-0 dark:bg-dark-300/60 dark:hover:bg-dark-300 dark:border-white/10"
            />
          )}
        </div>

        {publishedYear != null && publishedYear !== undefined && (
          <p className="text-sm text-ink-muted dark:text-light-400">
            Published {publishedYear}
          </p>
        )}

        <div className="book-info">
          <p>
            By{" "}
            <Link 
              href={`/library?author=${encodeURIComponent(author)}`}
              className="font-semibold text-ink-muted hover:underline hover:opacity-90 transition-opacity dark:text-light-200"
            >
              {author}
            </Link>
          </p>

          <p>
            Genre{" "}
            <Link 
              href={`/library?genre=${encodeURIComponent(genre)}`}
              className="font-semibold text-ink-muted hover:underline hover:opacity-90 transition-opacity dark:text-light-200"
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
          >
            {hasBorrowedBook && (
              <ReturnBookButton
                bookId={id}
                userId={userId}
              />
            )}
          </BorrowBook>
        )}
      </div>

      <div className="relative flex flex-1 justify-center min-w-0">
        <div className="relative">
          <Link href={`/books/${id}`} className="block hover:opacity-90 transition-opacity">
            <BookCover
              variant="wide"
              className="z-10"
              coverColor={coverColor}
              coverImage={coverUrl}
            />
          </Link>

          <div className="absolute left-16 top-10 rotate-12 opacity-40 max-lg:hidden">
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
    </div>

    {(bibliographicRows.length > 0 || libraryRows.length > 0) && (
      <div className="mt-10 grid w-full gap-6 md:grid-cols-2 lg:mt-14 lg:gap-8">
        {bibliographicRows.length > 0 && (
          <section
            aria-labelledby="book-bibliographic-info"
            className="rounded-xl border border-line bg-surface p-5 dark:border-white/10 dark:bg-white/5 sm:p-6"
          >
            <h3
              id="book-bibliographic-info"
              className="text-base font-semibold text-accent-green dark:text-primary xs:text-lg"
            >
              Bibliographic Information
            </h3>
            <table className="mt-4 w-full border-collapse text-left">
              <tbody>
                {bibliographicRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-t border-line/70 first:border-t-0 dark:border-white/10"
                  >
                    <th
                      scope="row"
                      className="py-2 pr-4 align-top text-xs font-medium text-ink-muted dark:text-light-400 sm:text-sm"
                    >
                      {row.label}
                    </th>
                    <td className="break-words py-2 align-top text-sm font-semibold text-ink dark:text-light-100 sm:text-base">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {libraryRows.length > 0 && (
          <section
            aria-labelledby="book-library-info"
            className="rounded-xl border border-line bg-surface p-5 dark:border-white/10 dark:bg-white/5 sm:p-6"
          >
            <h3
              id="book-library-info"
              className="text-base font-semibold text-accent-green dark:text-primary xs:text-lg"
            >
              Library Information
            </h3>
            <table className="mt-4 w-full border-collapse text-left">
              <tbody>
                {libraryRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-t border-line/70 first:border-t-0 dark:border-white/10"
                  >
                    <th
                      scope="row"
                      className="py-2 pr-4 align-top text-xs font-medium text-ink-muted dark:text-light-400 sm:text-sm"
                    >
                      {row.label}
                    </th>
                    <td className="break-words py-2 align-top text-sm font-semibold text-ink dark:text-light-100 sm:text-base">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    )}
    </section>
  );
};

export default BookOverview;
