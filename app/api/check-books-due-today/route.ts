import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    
    console.log(`🔍 Checking for books due today: ${todayDateString}`);

    // Find all borrowed books that are due today and haven't been returned
    const booksDueToday = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userEmail: users.email,
        userName: users.fullName,
        bookTitle: books.title,
        bookAuthor: books.author,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        reminderSent: borrowRecords.reminderSent,
      })
      .from(borrowRecords)
      .innerJoin(users, eq(borrowRecords.userId, users.id))
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          eq(borrowRecords.dueDate, todayDateString)
        )
      );

    console.log(`📚 Found ${booksDueToday.length} books due today`);

    if (booksDueToday.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No books due today",
        processed: 0,
        details: [],
      });
    }

    // Check if we have the necessary environment variables for email
    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;
    
    const results = {
      success: true,
      message: `Processed ${booksDueToday.length} book(s) due today`,
      processed: booksDueToday.length,
      details: [] as any[],
      emailsSent: 0,
      emailsSkipped: 0,
    };

    for (const record of booksDueToday) {
      console.log(`📧 Processing due today reminder for: ${record.userEmail} - "${record.bookTitle}"`);

      try {
        if (hasResendToken && hasQstashToken) {
          // Import email utilities
          const { sendEmail } = await import("@/lib/workflow");
          const { render } = await import("@react-email/render");
          const BookDueTodayEmail = (await import("@/emails/BookDueTodayEmail")).default;

          // Calculate loan duration
          const borrowDate = new Date(record.borrowDate);
          const dueDate = new Date(record.dueDate);
          const loanDuration = Math.ceil((dueDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));

          // Format dates for display
          const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long", 
            day: "numeric",
          });

          // Generate email HTML
          const emailHtml = await render(
            BookDueTodayEmail({
              userName: record.userName,
              bookTitle: record.bookTitle,
              bookAuthor: record.bookAuthor,
              borrowDate: formatDate(borrowDate),
              dueDate: formatDate(dueDate),
              loanDuration,
              profileUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-profile`,
            })
          );

          // Send email
          await sendEmail({
            email: record.userEmail,
            subject: `🚨 URGENT: "${record.bookTitle}" is due TODAY!`,
            message: emailHtml,
          });

          console.log(`✅ Due today email sent to: ${record.userEmail}`);
          results.emailsSent++;

          // Note: We could mark this as processed, but since it's "due today" reminders,
          // we might want to send multiple reminders throughout the day if needed
          // For now, we'll track but not mark as sent to allow multiple reminders if desired

          results.details.push({
            email: record.userEmail,
            bookTitle: record.bookTitle,
            status: "email_sent",
            timestamp: new Date().toISOString(),
          });

        } else {
          // Log what would be sent in development
          console.log(`📧 Would send due today email to: ${record.userEmail} for "${record.bookTitle}"`);
          results.emailsSkipped++;
          
          results.details.push({
            email: record.userEmail,
            bookTitle: record.bookTitle,
            status: "email_skipped_missing_env",
            missing: {
              resendToken: !hasResendToken,
              qstashToken: !hasQstashToken,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (emailError) {
        console.error(`❌ Failed to send due today email to ${record.userEmail}:`, emailError);
        
        results.details.push({
          email: record.userEmail,
          bookTitle: record.bookTitle,
          status: "email_failed",
          error: emailError instanceof Error ? emailError.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`📊 Due today reminders summary: ${results.emailsSent} sent, ${results.emailsSkipped} skipped`);
    
    return NextResponse.json(results);

  } catch (error) {
    console.error("❌ Error in due today reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: [],
      },
      { status: 500 }
    );
  }
}

// Allow POST method as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}