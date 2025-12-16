import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, daysOverdue = 3 } = await request.json();
    
    if (!bookTitle) {
      return NextResponse.json(
        { success: false, error: "Book title is required" },
        { status: 400 }
      );
    }

    // Calculate the overdue date (past due date)
    const today = new Date();
    const overdueDate = new Date(today);
    overdueDate.setDate(today.getDate() - daysOverdue);
    const overdueDateString = overdueDate.toISOString().split('T')[0];

    // Find the book by title
    const book = await db
      .select()
      .from(books)
      .where(eq(books.title, bookTitle))
      .limit(1);

    if (!book.length) {
      return NextResponse.json(
        { success: false, error: `Book "${bookTitle}" not found` },
        { status: 404 }
      );
    }

    // Find an active borrow record for this book
    const borrowRecord = await db
      .select({
        id: borrowRecords.id,
        userId: borrowRecords.userId,
        bookId: borrowRecords.bookId,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        status: borrowRecords.status,
        // overduePenaltySent: borrowRecords.overduePenaltySent, // Commented out until migration
        userName: users.fullName,
        userEmail: users.email,
      })
      .from(borrowRecords)
      .leftJoin(users, eq(borrowRecords.userId, users.id))
      .where(
        and(
          eq(borrowRecords.bookId, book[0].id),
          eq(borrowRecords.status, "BORROWED")
        )
      )
      .limit(1);

    if (!borrowRecord.length) {
      return NextResponse.json(
        { success: false, error: `No active borrow record found for "${bookTitle}"` },
        { status: 404 }
      );
    }

    // Update the due date to make it overdue and reset penalty sent flag for testing
    await db
      .update(borrowRecords)
      .set({
        dueDate: overdueDateString,
        // overduePenaltySent: false // Reset for testing - commented out until migration
      })
      .where(eq(borrowRecords.id, borrowRecord[0].id));

    console.log(`📚 Made "${bookTitle}" overdue by ${daysOverdue} days for testing`);

    return NextResponse.json({
      success: true,
      message: `Book "${bookTitle}" is now ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
      bookTitle,
      daysOverdue,
      newDueDate: overdueDateString,
      borrowRecordId: borrowRecord[0].id,
      userName: borrowRecord[0].userName,
      userEmail: borrowRecord[0].userEmail,
    });

  } catch (error) {
    console.error("❌ Error making book overdue:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to make book overdue" 
      },
      { status: 500 }
    );
  }
}