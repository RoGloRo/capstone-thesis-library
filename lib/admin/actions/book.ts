// lib/admin/actions/book.ts
"use server";

import { books } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const getBookById = async (id: string) => {
  try {
    // Use db.select() instead of db.query
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .then((res) => res[0]);

    console.log('Book found:', book); // For debugging

    if (!book) {
      return { success: false, message: "Book not found" };
    }

    return { success: true, book };
  } catch (error) {
    console.error("Error fetching book:", error);
    return { success: false, message: "Failed to fetch book" };
  }
};
export const createBook = async (params: BookParams) => {
  try {
    // If controlNumber provided, validate uniqueness
    if (params.controlNumber) {
      const existing = await db
        .select()
        .from(books)
        .where(eq(books.controlNumber, params.controlNumber))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, message: "Control number already in use" };
      }
    }

    // Ensure controlNumber exists: generate if missing
    let controlNumber = params.controlNumber ?? null;
    if (!controlNumber) {
      // try to generate a unique control number with retries
      controlNumber = await generateUniqueControlNumber();
    }

    const newBook = await db
      .insert(books)
      .values({
        ...params,
        controlNumber,
        availableCopies: params.totalCopies,
      })
      .returning();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newBook[0])),
    };
  } catch (error) {
    console.error("Error creating book:", error);
    return {
      success: false,
      message: "An error occurred while creating the book",
    };
  }
};

export const updateBook = async (id: string, params: BookParams) => {
  try {
    // Get the current book using select
    const [currentBook] = await db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);

    if (!currentBook) {
      return { success: false, message: "Book not found" };
    }

    // Calculate new available copies
    const newAvailableCopies = Math.max(
      0,
      currentBook.availableCopies + (params.totalCopies - currentBook.totalCopies)
    );

    // Determine control number behavior: do not change existing control numbers.
    let controlNumberToSet = currentBook.controlNumber ?? null;

    if (!controlNumberToSet) {
      // if current book has no control number, accept provided value (if any) after uniqueness check
      if (params.controlNumber) {
        const existing = await db
          .select()
          .from(books)
          .where(eq(books.controlNumber, params.controlNumber))
          .limit(1);

        if (existing.length > 0) {
          return { success: false, message: "Control number already in use" };
        }
        controlNumberToSet = params.controlNumber;
      } else {
        // generate one
        controlNumberToSet = await generateUniqueControlNumber();
      }
    }

    // Update the book
    const [updatedBook] = await db
      .update(books)
      .set({
        ...params,
        controlNumber: controlNumberToSet,
        availableCopies: newAvailableCopies,
      })
      .where(eq(books.id, id))
      .returning();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedBook)),
    };
  } catch (error) {
    console.error("Error updating book:", error);
    return {
      success: false,
      message: "An error occurred while updating the book",
    };
  }
};

// Helper: generate unique control number of format SL-YYYY-XXXXXX
async function generateUniqueControlNumber(): Promise<string> {
  const prefix = "SL";
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 10; attempt++) {
    // generate random 6-digit number
    const rand = crypto.randomInt(0, 1000000);
    const suffix = String(rand).padStart(6, "0");
    const candidate = `${prefix}-${year}-${suffix}`;

    const existing = await db
      .select()
      .from(books)
      .where(eq(books.controlNumber, candidate))
      .limit(1);

    if (existing.length === 0) {
      return candidate;
    }
    // otherwise loop and try again
  }

  // worst-case fallback: use timestamp-based suffix
  const fallback = `${prefix}-${year}-${String(Date.now()).slice(-6)}`;
  return fallback;
}