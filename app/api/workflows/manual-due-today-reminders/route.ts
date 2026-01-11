import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, isNull } from "drizzle-orm";
import { render } from "@react-email/render";
import BookDueTodayEmail from "@/emails/BookDueTodayEmail";
import { sendDueTodayEmail } from "@/lib/email-with-logging";

export async function POST(request: NextRequest) {
  try {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const booksDueToday = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userEmail: users.email,
        userName: users.fullName,
        bookTitle: books.title,
        bookAuthor: books.author,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
      })
      .from(borrowRecords)
      .innerJoin(users, eq(borrowRecords.userId, users.id))
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          eq(borrowRecords.dueDate, todayString),
          isNull(borrowRecords.returnDate)
        )
      );

    let sent = 0;
    let failed = 0;

    for (const record of booksDueToday) {
      try {
        const borrowDate = new Date(record.borrowDate);
        const dueDate = new Date(record.dueDate);
        const loanDuration = Math.ceil((dueDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));

        const formattedBorrowDate = borrowDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formattedDueDate = dueDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const emailHtml = await render(
          BookDueTodayEmail({
            userName: record.userName || "Library Member",
            bookTitle: record.bookTitle || "Unknown Book",
            bookAuthor: record.bookAuthor || "Unknown Author",
            borrowDate: formattedBorrowDate,
            dueDate: formattedDueDate,
            loanDuration,
            profileUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`}/my-profile`,
          })
        );

        await sendDueTodayEmail(
          record.userEmail!,
          record.userName || "Library Member",
          emailHtml,
          record.bookTitle || "Unknown Book",
          { triggerSource: "ADMIN", borrowRecordId: record.borrowRecordId }
        );

        sent++;

        // small delay
        await new Promise((res) => setTimeout(res, 300));
      } catch (err) {
        failed++;
        console.error("Failed to send manual due-today email:", err);
      }
    }

    return NextResponse.json({ success: true, total: booksDueToday.length, sent, failed });
  } catch (error) {
    console.error("Error in manual due-today reminders:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
