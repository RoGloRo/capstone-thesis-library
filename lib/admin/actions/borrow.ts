// lib/admin/actions/borrow.ts
"use server";

import { db } from "@/database/drizzle";
import { borrowRecords, users, books } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { BorrowRecordsResponse, BorrowRecord } from "@/types/borrow";

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

    const now = new Date();
    const recordsWithStatus = records.map(record => {
      const isOverdue = !record.returnDate && new Date(record.dueDate) < now;
      const status = isOverdue ? "OVERDUE" : (record.status as "BORROWED" | "RETURNED");

      return {
        ...record,
        status,
        universityCard: record.universityCard 
          ? record.universityCard.startsWith('http') || record.universityCard.startsWith('/ids/')
            ? record.universityCard
            : `/ids/${record.universityCard}`
          : null
      };
    });

    return { success: true, data: recordsWithStatus as BorrowRecord[] };
  } catch (error) {
    console.error("Error fetching borrow records:", error);
    return { 
      success: false, 
      message: "Failed to fetch borrow records",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};