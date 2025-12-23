import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const results = {
    dueTodayReminders: { success: false, message: "", details: {} },
    dueDateReminders: { success: false, message: "", details: {} },
    overdueBooks: { success: false, message: "", details: {} },
  };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 1. Check books due today
    console.log("🔄 Checking books due today...");
    try {
      const dueTodayResponse = await fetch(`${baseUrl}/api/check-books-due-today`, {
        method: 'GET',
      });
      const dueTodayData = await dueTodayResponse.json();
      results.dueTodayReminders = {
        success: dueTodayData.success,
        message: dueTodayData.message,
        details: dueTodayData,
      };
      console.log(`✅ Due today: ${dueTodayData.message}`);
    } catch (error) {
      results.dueTodayReminders = {
        success: false,
        message: `Failed to check due today: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {},
      };
      console.error("❌ Due today check failed:", error);
    }

    // 2. Check due date reminders (tomorrow)
    console.log("🔄 Checking due date reminders...");
    try {
      const dueDateResponse = await fetch(`${baseUrl}/api/check-due-date-reminders`, {
        method: 'POST',
      });
      const dueDateData = await dueDateResponse.json();
      results.dueDateReminders = {
        success: dueDateData.success,
        message: dueDateData.message,
        details: dueDateData,
      };
      console.log(`✅ Due date reminders: ${dueDateData.message}`);
    } catch (error) {
      results.dueDateReminders = {
        success: false,
        message: `Failed to check due date reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {},
      };
      console.error("❌ Due date reminders check failed:", error);
    }

    // 3. Check overdue books
    console.log("🔄 Checking overdue books...");
    try {
      const overdueResponse = await fetch(`${baseUrl}/api/check-overdue-books`, {
        method: 'POST',
      });
      const overdueData = await overdueResponse.json();
      results.overdueBooks = {
        success: overdueData.success,
        message: overdueData.message,
        details: overdueData,
      };
      console.log(`✅ Overdue books: ${overdueData.message}`);
    } catch (error) {
      results.overdueBooks = {
        success: false,
        message: `Failed to check overdue books: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {},
      };
      console.error("❌ Overdue books check failed:", error);
    }

    // Summary
    const totalSuccess = [
      results.dueTodayReminders.success,
      results.dueDateReminders.success,
      results.overdueBooks.success,
    ].filter(Boolean).length;

    console.log(`📊 Manual workflow summary: ${totalSuccess}/3 checks completed successfully`);

    return NextResponse.json({
      success: totalSuccess > 0,
      message: `Manual email notification check completed. ${totalSuccess}/3 checks successful.`,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalChecks: 3,
        successfulChecks: totalSuccess,
        failedChecks: 3 - totalSuccess,
      },
    });

  } catch (error) {
    console.error("❌ Manual workflow execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Manual workflow execution failed",
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Manual Email Notification Workflow",
    description: "Manually trigger all email notification checks (due today, due tomorrow, overdue)",
    usage: "POST /api/manual-email-notifications",
    checks: [
      "Books due today (urgent reminders)",
      "Books due tomorrow (advance reminders)",
      "Overdue books (penalty notifications)",
    ],
    note: "This is a workaround for automatic scheduling issues. Call this endpoint manually or set up a cron job to trigger it daily.",
  });
}