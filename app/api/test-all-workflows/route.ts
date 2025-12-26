import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    
    console.log("🧪 Testing all email notification workflows manually...");

    const results = {
      overdue: null as any,
      dueToday: null as any,
      dueDateReminders: null as any,
      errors: [] as string[],
    };

    // Test 1: Overdue penalties
    try {
      console.log("1. Testing overdue penalties workflow...");
      const response = await fetch(`${baseUrl}/api/workflows/daily-overdue-penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_test: true }),
      });
      
      if (response.ok) {
        results.overdue = await response.json();
        console.log(`✅ Overdue: Found ${results.overdue.totalOverdue || 0} overdue books, sent ${results.overdue.emailsSent || 0} emails`);
      } else {
        const error = await response.text();
        results.errors.push(`Overdue workflow: ${error}`);
        console.error("❌ Overdue workflow failed:", error);
      }
    } catch (error) {
      results.errors.push(`Overdue workflow: ${error}`);
      console.error("❌ Overdue workflow error:", error);
    }

    // Test 2: Due today reminders
    try {
      console.log("2. Testing due today reminders workflow...");
      const response = await fetch(`${baseUrl}/api/workflows/daily-due-today-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_test: true }),
      });
      
      if (response.ok) {
        results.dueToday = await response.json();
        console.log(`✅ Due Today: Found ${results.dueToday.totalDueToday || 0} books due today, sent ${results.dueToday.emailsSent || 0} emails`);
      } else {
        const error = await response.text();
        results.errors.push(`Due today workflow: ${error}`);
        console.error("❌ Due today workflow failed:", error);
      }
    } catch (error) {
      results.errors.push(`Due today workflow: ${error}`);
      console.error("❌ Due today workflow error:", error);
    }

    // Test 3: Due date reminders (tomorrow)
    try {
      console.log("3. Testing due date reminders workflow...");
      const response = await fetch(`${baseUrl}/api/check-due-date-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_test: true }),
      });
      
      if (response.ok) {
        results.dueDateReminders = await response.json();
        const resultData = results.dueDateReminders.results;
        console.log(`✅ Due Date Reminders: Processed ${resultData?.processed || 0} books, sent ${resultData?.sent || 0} emails`);
      } else {
        const error = await response.text();
        results.errors.push(`Due date reminders workflow: ${error}`);
        console.error("❌ Due date reminders workflow failed:", error);
      }
    } catch (error) {
      results.errors.push(`Due date reminders workflow: ${error}`);
      console.error("❌ Due date reminders workflow error:", error);
    }

    // Environment check
    const envCheck = {
      resendToken: !!process.env.RESEND_TOKEN,
      qstashToken: !!process.env.QSTASH_TOKEN,
      baseUrl,
    };

    console.log("\n🔧 Environment check:");
    console.log(`   RESEND_TOKEN: ${envCheck.resendToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`   QSTASH_TOKEN: ${envCheck.qstashToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`   BASE_URL: ${envCheck.baseUrl}`);

    return NextResponse.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 
        ? "All email workflows tested successfully"
        : `${results.errors.length} workflows failed`,
      results,
      environment: envCheck,
      summary: {
        overdueBooks: results.overdue?.totalOverdue || 0,
        overdueEmailsSent: results.overdue?.emailsSent || 0,
        dueTodayBooks: results.dueToday?.totalDueToday || 0,
        dueTodayEmailsSent: results.dueToday?.emailsSent || 0,
        dueTomorrowBooks: results.dueDateReminders?.results?.processed || 0,
        dueTomorrowEmailsSent: results.dueDateReminders?.results?.sent || 0,
      },
      errors: results.errors,
    });

  } catch (error) {
    console.error("❌ Error testing workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to test workflows",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email Workflow Testing",
    description: "POST to this endpoint to manually test all email notification workflows",
    workflows: {
      overdue: "Check for overdue books and send penalty emails",
      dueToday: "Send urgent reminders for books due today",
      dueDateReminders: "Send reminders for books due tomorrow",
    },
    usage: "POST /api/test-all-workflows",
  });
}