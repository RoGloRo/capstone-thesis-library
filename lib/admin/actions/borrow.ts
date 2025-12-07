// lib/admin/actions/borrow.ts
"use server";

import { db } from "@/database/drizzle";
import { borrowRecords, users, books } from "@/database/schema";
import { and, eq } from "drizzle-orm";

export const getBorrowRecords = async (): Promise<BorrowRecordsResponse> => {
  try {
    const records = await db
      .select({
        id: borrowRecords.id,
        userName: users.fullName,
        userEmail: users.email,
        universityId: users.universityId,
        universityCard: users.universityCard,
        bookTitle: books.title,
        bookAuthor: books.author,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        returnDate: borrowRecords.returnDate,
        status: borrowRecords.status,
      })
      .from(borrowRecords)
      .leftJoin(users, eq(borrowRecords.userId, users.id))
      .leftJoin(books, eq(borrowRecords.bookId, books.id))
      .orderBy(borrowRecords.borrowDate);

    const recordsWithImageUrl = records.map(record => ({
  ...record,
  // If universityCard starts with /ids/, it's already in the correct format
  // Otherwise, prepend /ids/ to the filename
  universityCard: record.universityCard 
    ? record.universityCard.startsWith('http') || record.universityCard.startsWith('/ids/')
      ? record.universityCard
      : `/ids/${record.universityCard}`
    : null
}));
    return { success: true, data: recordsWithImageUrl };
  } catch (error) {
    console.error("Error fetching borrow records:", error);
    return { 
      success: false, 
      message: "Failed to fetch borrow records",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};