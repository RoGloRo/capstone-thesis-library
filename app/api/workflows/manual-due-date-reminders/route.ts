import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { render } from "@react-email/render";
import DueDateReminderEmail from "@/emails/DueDateReminderEmail";
import { sendDueReminderEmail } from "@/lib/email-with-logging";

export async function POST(request: NextRequest) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split("T")[0];

    const booksDueTomorrow = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userEmail: users.email,
        userName: users.fullName,
        bookTitle: books.title,
        bookAuthor: books.author,
        dueDate: borrowRecords.dueDate,
      })
      .from(borrowRecords)
      .innerJoin(users, eq(borrowRecords.userId, users.id))
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          eq(borrowRecords.dueDate, tomorrowString)
        )
      );

    let sent = 0;
    let failed = 0;

    for (const record of booksDueTomorrow) {
      try {
        const formattedDueDate = new Date(record.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const emailHtml = await render(
          DueDateReminderEmail({
            userName: record.userName || "Library Member",
            bookTitle: record.bookTitle || "Unknown Book",
            bookAuthor: record.bookAuthor || "Unknown Author",
            dueDate: formattedDueDate,
            profileUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`}/my-profile`,
          })
        );

        await sendDueReminderEmail(
          record.userEmail!,
          record.userName || "Library Member",
          emailHtml,
          record.bookTitle || "Unknown Book",
          { triggerSource: "ADMIN", borrowRecordId: record.borrowRecordId }
        );

        sent++;
      } catch (err) {
        failed++;
        console.error("Failed to send manual due-date reminder:", err);
      }
    }

    return NextResponse.json({ success: true, total: booksDueTomorrow.length, sent, failed });
  } catch (error) {
    console.error("Error in manual due-date reminders:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
