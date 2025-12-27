import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import OverdueBookEmail from "@/emails/OverdueBookEmail";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Checking for overdue books...");

    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Find overdue books (due date < today AND status = 'BORROWED' AND penalty email not sent)
    const overdueRecords = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userId: borrowRecords.userId,
        bookId: borrowRecords.bookId,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        // overduePenaltySent: borrowRecords.overduePenaltySent, // Commented out until migration
        userFullName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        bookAuthor: books.author,
      })
      .from(borrowRecords)
      .leftJoin(users, eq(borrowRecords.userId, users.id))
      .leftJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          lt(borrowRecords.dueDate, todayString),
          // eq(borrowRecords.overduePenaltySent, false), // Commented out until migration
          isNull(borrowRecords.returnDate) // Make sure book isn't already returned
        )
      );

    console.log(`📚 Found ${overdueRecords.length} overdue books requiring penalty notifications`);

    const results = [];

    // Check if we have necessary environment variables
    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;

    for (const record of overdueRecords) {
      try {
        // Calculate days overdue
        const dueDate = new Date(record.dueDate);
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate penalty (e.g., $0.50 per day)
        const penaltyPerDay = 0.50;
        const penaltyAmount = daysOverdue * penaltyPerDay;

        const emailData = {
          userName: record.userFullName || 'Library Member',
          bookTitle: record.bookTitle || 'Unknown Book',
          bookAuthor: record.bookAuthor || 'Unknown Author',
          borrowDate: new Date(record.borrowDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long", 
            day: "numeric",
          }),
          dueDate: new Date(record.dueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          daysOverdue,
          penaltyAmount,
          returnBookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-profile`,
        };

        if (hasResendToken && hasQstashToken) {
          // Send the email
          const emailHtml = await render(OverdueBookEmail(emailData));
          
          await sendEmail({
            email: record.userEmail!,
            subject: `⚠️ OVERDUE: ${record.bookTitle} - Immediate Return Required`,
            message: emailHtml,
          });

          // Mark penalty email as sent
          await db
            .update(borrowRecords)
            // .set({ overduePenaltySent: true }) // Commented out until migration
            .set({ reminderSent: true }) // Use reminderSent as temp flag
            .where(eq(borrowRecords.id, record.borrowRecordId));

          results.push({
            borrowRecordId: record.borrowRecordId,
            userEmail: record.userEmail,
            bookTitle: record.bookTitle,
            daysOverdue,
            penaltyAmount,
            status: "email_sent",
          });

          console.log(`✅ Overdue penalty email sent to ${record.userEmail} for "${record.bookTitle}"`);
        } else {
          // Log what would be sent (missing environment variables)
          results.push({
            borrowRecordId: record.borrowRecordId,
            userEmail: record.userEmail,
            bookTitle: record.bookTitle,
            daysOverdue,
            penaltyAmount,
            status: "email_skipped_missing_env",
            missing: {
              resendToken: !hasResendToken,
              qstashToken: !hasQstashToken,
            },
          });

          console.log(`📧 Overdue penalty email (missing env vars) for ${record.userEmail}:`, emailData);
        }
      } catch (emailError) {
        console.error(`❌ Failed to send overdue penalty email for record ${record.borrowRecordId}:`, emailError);
        
        results.push({
          borrowRecordId: record.borrowRecordId,
          userEmail: record.userEmail,
          bookTitle: record.bookTitle,
          status: "email_failed",
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueRecords.length} overdue books`,
      overdueCount: overdueRecords.length,
      results,
    });

  } catch (error) {
    console.error("❌ Error checking overdue books:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check overdue books",
      },
      { status: 500 }
    );
  }
}