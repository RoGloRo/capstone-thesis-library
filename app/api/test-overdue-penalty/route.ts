import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import OverdueBookEmail from "@/emails/OverdueBookEmail";

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json();
    
    // Find an overdue book for this user, or any overdue book if no email provided
    let query = db
      .select({
        borrowRecordId: borrowRecords.id,
        userId: borrowRecords.userId,
        bookId: borrowRecords.bookId,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
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
          lt(borrowRecords.dueDate, new Date().toISOString().split('T')[0]),
          isNull(borrowRecords.returnDate)
        )
      );

    if (userEmail) {
      query = query.where(eq(users.email, userEmail));
    }

    const overdueRecords = await query.limit(1);

    if (!overdueRecords.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: userEmail 
            ? `No overdue books found for user ${userEmail}` 
            : "No overdue books found in the system" 
        },
        { status: 404 }
      );
    }

    const record = overdueRecords[0];
    
    // Calculate days overdue
    const today = new Date();
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
      returnBookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/my-profile`,
    };

    // Check if we have the necessary environment variables for email
    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;

    if (!hasResendToken || !hasQstashToken) {
      return NextResponse.json({
        success: false,
        error: "Email service not configured",
        missingEnvVars: {
          resendToken: !hasResendToken,
          qstashToken: !hasQstashToken,
        },
        emailPreview: emailData,
      });
    }

    // Render and send the test email
    const emailHtml = await render(OverdueBookEmail(emailData));
    
    await sendEmail({
      email: record.userEmail!,
      subject: `[TEST] ⚠️ OVERDUE PENALTY: ${record.bookTitle} - ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Late`,
      message: emailHtml,
    });

    console.log(`✅ Test overdue penalty email sent to ${record.userEmail}`);

    return NextResponse.json({
      success: true,
      message: `Test overdue penalty email sent successfully`,
      recipient: record.userEmail,
      bookTitle: record.bookTitle,
      daysOverdue,
      penaltyAmount: `$${penaltyAmount.toFixed(2)}`,
      emailData,
    });

  } catch (error) {
    console.error("❌ Error sending test overdue penalty email:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to send test email" 
      },
      { status: 500 }
    );
  }
}