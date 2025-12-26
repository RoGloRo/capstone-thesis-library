import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import DueDateReminderEmail from "@/emails/DueDateReminderEmail";

export async function POST() {
  try {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`Checking for books due on: ${tomorrowDateString}`);

    // Find all borrowed books that are due tomorrow and haven't had due date reminders sent
    const booksDueTomorrow = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userEmail: users.email,
        userName: users.fullName,
        bookTitle: books.title,
        bookAuthor: books.author,
        dueDate: borrowRecords.dueDate,
        reminderSent: borrowRecords.reminderSent,
      })
      .from(borrowRecords)
      .innerJoin(users, eq(borrowRecords.userId, users.id))
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          eq(borrowRecords.dueDate, tomorrowDateString),
          eq(borrowRecords.reminderSent, false) // Only books that haven't had due date reminders sent
        )
      );

    console.log(`Found ${booksDueTomorrow.length} books due tomorrow without reminders`);

    const results = {
      processed: 0,
      sent: 0,
      errors: 0,
      details: [] as any[],
    };

    // Process each book and send reminders
    for (const record of booksDueTomorrow) {
      results.processed++;
      
      try {
        const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/my-profile`;
        
        // Format the due date nicely
        const formattedDueDate = new Date(record.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Check if we can send email directly (for development) or need to use workflow
        const hasResendToken = !!process.env.RESEND_TOKEN;
        const hasQstashToken = !!process.env.QSTASH_TOKEN;
        
        if (hasResendToken && hasQstashToken) {
          // Send email directly (development mode)
          const emailHtml = await render(
            DueDateReminderEmail({
              userName: record.userName,
              bookTitle: record.bookTitle,
              bookAuthor: record.bookAuthor,
              dueDate: formattedDueDate,
              profileUrl,
            })
          );

          await sendEmail({
            email: record.userEmail,
            subject: `⏰ Reminder: "${record.bookTitle}" is due tomorrow!`,
            message: emailHtml,
          });

          results.sent++;
          console.log(`✅ Sent reminder to ${record.userEmail} for "${record.bookTitle}"`);
        } else {
          // Use workflow system (production mode)
          const { workflowClient } = await import("@/lib/workflow");
          
          await workflowClient.trigger({
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/workflows/due-date-reminder`,
            body: {
              userEmail: record.userEmail,
              userName: record.userName,
              bookTitle: record.bookTitle,
              bookAuthor: record.bookAuthor,
              dueDate: formattedDueDate,
              borrowRecordId: record.borrowRecordId,
              profileUrl,
            },
          });

          results.sent++;
          console.log(`✅ Triggered workflow reminder for ${record.userEmail} for "${record.bookTitle}"`);
        }

        // Mark reminder as sent to prevent duplicates
        try {
          await db
            .update(borrowRecords)
            .set({ reminderSent: true })
            .where(eq(borrowRecords.id, record.borrowRecordId));
          
          console.log(`✅ Marked due date reminder as sent for record: ${record.borrowRecordId}`);
        } catch (updateError) {
          console.warn(`⚠️ Failed to update reminder status for ${record.borrowRecordId}:`, updateError);
        }

        results.details.push({
          borrowRecordId: record.borrowRecordId,
          userEmail: record.userEmail,
          bookTitle: record.bookTitle,
          status: "sent",
        });

      } catch (emailError) {
        results.errors++;
        console.error(`Failed to send reminder to ${record.userEmail} for "${record.bookTitle}":`, emailError);
        
        results.details.push({
          borrowRecordId: record.borrowRecordId,
          userEmail: record.userEmail,
          bookTitle: record.bookTitle,
          status: "error",
          error: emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    console.log(`Due date reminder check completed. Processed: ${results.processed}, Sent: ${results.sent}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      message: `Due date reminder check completed`,
      results,
    });

  } catch (error) {
    console.error("Error in due date reminder check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}