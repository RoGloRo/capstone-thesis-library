"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;

  try {
    // Check if user already has an active borrowing record for this book
    const existingBorrowing = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, userId),
          eq(borrowRecords.bookId, bookId),
          eq(borrowRecords.status, "BORROWED" as const)
        )
      )
      .limit(1);

    if (existingBorrowing.length > 0) {
      return {
        success: false,
        error: "You already have an active borrowing for this book",
      };
    }

    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        error: "Book is not available for borrowing. Out of copies",
      };
    }

    const dueDate = dayjs().add(7, "day").toDate().toDateString();

    const record = await db.insert(borrowRecords).values({
      userId,
      bookId,
      dueDate,
      status: "BORROWED",
    });

    await db
      .update(books)
      .set({ availableCopies: book[0].availableCopies - 1 })
      .where(eq(books.id, bookId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      error: "An error occurred while borrowing the book",
    };
  }
};

export const returnBook = async (params: { borrowRecordId: string; bookId: string }) => {
  const { borrowRecordId, bookId } = params;

  try {
    // First get the current available copies
    const [book] = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      throw new Error('Book not found');
    }

    // Update the borrow record
    const [record] = await db
      .update(borrowRecords)
      .set({
        status: 'STATUS', // Using 'STATUS' as the return status since it's in the enum
        returnDate: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      })
      .where(eq(borrowRecords.id, borrowRecordId))
      .returning();

    if (!record) {
      throw new Error('Borrow record not found');
    }

    // Update the book's available copies
    await db
      .update(books)
      .set({ 
        availableCopies: book.availableCopies + 1 
      })
      .where(eq(books.id, bookId));

    return { success: true, data: record };
  } catch (error) {
    console.error('Error returning book:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to return book'
    };
  }
};
