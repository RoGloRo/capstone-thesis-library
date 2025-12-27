import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, lt, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Running automated email system diagnostics...");

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "NOT SET",
      hasResendToken: !!process.env.RESEND_TOKEN,
      hasQStashToken: !!process.env.QSTASH_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || "NOT SET",
    };

    // Check for overdue books
    const overdueBooks = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        dueDate: borrowRecords.dueDate,
        reminderSent: borrowRecords.reminderSent,
      })
      .from(borrowRecords)
      .leftJoin(users, eq(borrowRecords.userId, users.id))
      .leftJoin(books, eq(borrowRecords.bookId, books.id))
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          lt(borrowRecords.dueDate, todayString),
          isNull(borrowRecords.returnDate)
        )
      );

    // Check for books due today
    const booksDueToday = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
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

    // Check for books due tomorrow (for due date reminders)
    const booksDueTomorrow = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        dueDate: borrowRecords.dueDate,
        reminderSent: borrowRecords.reminderSent,
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

    // Calculate days overdue for each overdue book
    const overdueDetails = overdueBooks.map(book => {
      const dueDate = new Date(book.dueDate);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const penaltyAmount = daysOverdue * 0.50;
      
      return {
        borrowRecordId: book.borrowRecordId,
        userName: book.userName,
        userEmail: book.userEmail,
        bookTitle: book.bookTitle,
        dueDate: book.dueDate,
        daysOverdue,
        penaltyAmount: `$${penaltyAmount.toFixed(2)}`,
        reminderSent: book.reminderSent,
        needsEmail: !book.reminderSent,
      };
    });

    const dueTodayDetails = booksDueToday.map(book => ({
      borrowRecordId: book.borrowRecordId,
      userName: book.userName,
      userEmail: book.userEmail,
      bookTitle: book.bookTitle,
      dueDate: book.dueDate,
    }));

    const dueTomorrowDetails = booksDueTomorrow.map(book => ({
      borrowRecordId: book.borrowRecordId,
      userName: book.userName,
      userEmail: book.userEmail,
      bookTitle: book.bookTitle,
      dueDate: book.dueDate,
      reminderSent: book.reminderSent,
      needsEmail: !book.reminderSent,
    }));

    const cronSchedules = {
      overdueEmails: "Daily at 9:00 AM UTC (POST /api/workflows/daily-overdue-penalties)",
      dueTodayEmails: "Daily at 8:00 AM UTC (POST /api/workflows/daily-due-today-reminders)",
      dueDateReminders: "Daily at 10:00 AM UTC (POST /api/check-due-date-reminders)",
    };

    const summary = {
      environment: envCheck,
      currentDate: todayString,
      emailSystemStatus: envCheck.hasResendToken && envCheck.hasQStashToken ? "✅ CONFIGURED" : "❌ NOT CONFIGURED",
      overdueBooks: {
        total: overdueBooks.length,
        needingEmail: overdueDetails.filter(b => b.needsEmail).length,
        details: overdueDetails,
      },
      booksDueToday: {
        total: booksDueToday.length,
        details: dueTodayDetails,
      },
      booksDueTomorrow: {
        total: booksDueTomorrow.length,
        needingReminder: dueTomorrowDetails.filter(b => b.needsEmail).length,
        details: dueTomorrowDetails,
      },
      cronSchedules,
      manualTriggerEndpoints: {
        overdueEmails: "POST /api/workflows/daily-overdue-penalties",
        dueTodayEmails: "POST /api/workflows/daily-due-today-reminders",
        dueDateReminders: "POST /api/check-due-date-reminders",
      },
    };

    console.log("📊 Diagnostics Summary:", {
      overdue: summary.overdueBooks.total,
      dueToday: summary.booksDueToday.total,
      dueTomorrow: summary.booksDueTomorrow.total,
      emailSystemStatus: summary.emailSystemStatus,
    });

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error("❌ Diagnostics error:", error);
    return NextResponse.json(
      {
        error: "Diagnostics failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter required (overdue, due-today, or due-tomorrow)" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    let endpoint = "";
    let description = "";

    switch (action) {
      case "overdue":
        endpoint = `${baseUrl}/api/workflows/daily-overdue-penalties`;
        description = "Trigger overdue book penalty emails";
        break;
      case "due-today":
        endpoint = `${baseUrl}/api/workflows/daily-due-today-reminders`;
        description = "Trigger due today reminder emails";
        break;
      case "due-tomorrow":
        endpoint = `${baseUrl}/api/check-due-date-reminders`;
        description = "Trigger due date reminder emails (1 day before)";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: overdue, due-today, or due-tomorrow" },
          { status: 400 }
        );
    }

    console.log(`🚀 Manually triggering: ${description}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      action,
      description,
      endpoint,
      result,
    });

  } catch (error) {
    console.error("❌ Manual trigger error:", error);
    return NextResponse.json(
      {
        error: "Manual trigger failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}