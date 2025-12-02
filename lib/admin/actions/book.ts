// lib/admin/actions/book.ts
"use server";

import { books } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
// import { BookParams } from "@/types";

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
    const newBook = await db
      .insert(books)
      .values({
        ...params,
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

    // Update the book
    const [updatedBook] = await db
      .update(books)
      .set({
        ...params,
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