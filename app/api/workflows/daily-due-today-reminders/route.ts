import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import BookDueTodayEmail from "@/emails/BookDueTodayEmail";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Daily due today reminders workflow triggered");
    
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    
    console.log(`🔍 Daily check: Books due today (${todayDateString})`);

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
      })
      .from(borrowRecords)
      .innerJoin(users, eq(borrowRecords.userId, users.id))
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          eq(borrowRecords.dueDate, todayDateString),
          isNull(borrowRecords.returnDate)
        )
      );

    console.log(`📚 Found ${booksDueToday.length} books due today`);

    if (booksDueToday.length === 0) {
      console.log("✅ No books due today - no reminders needed");
      return NextResponse.json({
        success: true,
        message: "No books due today",
        processed: 0,
      });
    }

    // Check if we have necessary environment variables
    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;

    if (!hasResendToken || !hasQstashToken) {
      console.log("⚠️ Missing email environment variables:", {
        resendToken: !hasResendToken,
        qstashToken: !hasQstashToken,
      });
      
      return NextResponse.json({
        success: false,
        error: "Email service not configured properly",
        missingEnvVars: {
          resendToken: !hasResendToken,
          qstashToken: !hasQstashToken,
        },
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const record of booksDueToday) {
      try {
        console.log(`📧 Sending due today reminder to: ${record.userEmail} for "${record.bookTitle}"`);

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
            userName: record.userName || 'Library Member',
            bookTitle: record.bookTitle || 'Unknown Book',
            bookAuthor: record.bookAuthor || 'Unknown Author',
            borrowDate: formatDate(borrowDate),
            dueDate: formatDate(dueDate),
            loanDuration,
            profileUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-profile`,
          })
        );

        // Send email
        await sendEmail({
          email: record.userEmail!,
          subject: `🚨 URGENT: "${record.bookTitle}" is due TODAY!`,
          message: emailHtml,
        });

        console.log(`✅ Due today email sent successfully to: ${record.userEmail}`);
        emailsSent++;

        // Add a small delay between emails to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to send due today email to ${record.userEmail}: ${error}`);
        emailsFailed++;
      }
    }

    const summary = {
      totalDueToday: booksDueToday.length,
      emailsSent,
      emailsFailed,
      processedAt: new Date().toISOString(),
    };

    console.log("📊 Due today reminders workflow completed:", summary);

    return NextResponse.json({
      success: true,
      message: `Due today reminders completed. Sent ${emailsSent} emails.`,
      ...summary,
    });

  } catch (error) {
    console.error("❌ Error in due today reminders workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process due today reminders",
      },
      { status: 500 }
    );
  }
}