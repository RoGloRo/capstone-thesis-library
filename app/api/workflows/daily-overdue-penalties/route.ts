import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import OverdueBookEmail from "@/emails/OverdueBookEmail";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Daily overdue book penalty workflow triggered");

    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Find overdue books that haven't received penalty notifications yet
    const overdueRecords = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userId: borrowRecords.userId,
        bookId: borrowRecords.bookId,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        reminderSent: borrowRecords.reminderSent, // Use reminderSent to track if penalty email was sent
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
          eq(borrowRecords.reminderSent, false), // Only books that haven't had penalty emails sent
          isNull(borrowRecords.returnDate)
        )
      );

    console.log(`📚 Found ${overdueRecords.length} overdue books for penalty notifications`);

    let emailsSent = 0;
    let emailsFailed = 0;

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

    for (const record of overdueRecords) {
      try {
        // Calculate days overdue
        const dueDate = new Date(record.dueDate);
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only send penalty emails for books that are at least 1 day overdue
        if (daysOverdue < 1) continue;

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

        // Render and send the email
        const emailHtml = await render(OverdueBookEmail(emailData));
        
        await sendEmail({
          email: record.userEmail!,
          subject: `⚠️ OVERDUE PENALTY: ${record.bookTitle} - ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Late`,
          message: emailHtml,
        });

        // Mark penalty email as sent
        await db
          .update(borrowRecords)
          .set({ reminderSent: true }) // Mark that penalty email has been sent
          .where(eq(borrowRecords.id, record.borrowRecordId));

        emailsSent++;
        console.log(`✅ Overdue penalty email sent to ${record.userEmail} for "${record.bookTitle}" (${daysOverdue} days overdue, $${penaltyAmount.toFixed(2)} penalty)`);

      } catch (emailError) {
        emailsFailed++;
        console.error(`❌ Failed to send overdue penalty email for record ${record.borrowRecordId}:`, emailError);
      }
    }

    const summary = {
      totalOverdue: overdueRecords.length,
      emailsSent,
      emailsFailed,
      processedAt: new Date().toISOString(),
    };

    console.log("📊 Daily overdue penalty workflow completed:", summary);

    return NextResponse.json({
      success: true,
      message: `Daily overdue penalty workflow completed. Sent ${emailsSent} emails.`,
      ...summary,
    });

  } catch (error) {
    console.error("❌ Error in daily overdue penalty workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process overdue books",
      },
      { status: 500 }
    );
  }
}