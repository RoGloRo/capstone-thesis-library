import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    
    const results = {
      overdueScheduled: false,
      dueTodayScheduled: false,
      dueDateRemindersScheduled: false,
      errors: [] as string[],
    };

    console.log("🚀 Setting up all email notification schedules...");

    // 1. Setup overdue penalties (9:00 AM daily)
    try {
      const overdueResponse = await fetch(`${baseUrl}/api/setup-overdue-penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (overdueResponse.ok) {
        const data = await overdueResponse.json();
        results.overdueScheduled = true;
        console.log("✅ Overdue penalties scheduled:", data.scheduleId);
      } else {
        const error = await overdueResponse.text();
        results.errors.push(`Overdue penalties: ${error}`);
      }
    } catch (error) {
      results.errors.push(`Overdue penalties: ${error}`);
    }

    // 2. Setup due today reminders (9:00 AM daily)  
    try {
      const dueTodayResponse = await fetch(`${baseUrl}/api/setup-due-today-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule' }),
      });
      
      if (dueTodayResponse.ok) {
        const data = await dueTodayResponse.json();
        results.dueTodayScheduled = true;
        console.log("✅ Due today reminders scheduled:", data.scheduleId);
      } else {
        const error = await dueTodayResponse.text();
        results.errors.push(`Due today reminders: ${error}`);
      }
    } catch (error) {
      results.errors.push(`Due today reminders: ${error}`);
    }

    // 3. Setup due date reminders (8:00 AM daily)
    try {
      const dueDateResponse = await fetch(`${baseUrl}/api/setup-due-date-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule' }),
      });
      
      if (dueDateResponse.ok) {
        const data = await dueDateResponse.json();
        results.dueDateRemindersScheduled = true;
        console.log("✅ Due date reminders scheduled:", data.scheduleId);
      } else {
        const error = await dueDateResponse.text();
        results.errors.push(`Due date reminders: ${error}`);
      }
    } catch (error) {
      results.errors.push(`Due date reminders: ${error}`);
    }

    const allScheduled = results.overdueScheduled && results.dueTodayScheduled && results.dueDateRemindersScheduled;

    return NextResponse.json({
      success: allScheduled,
      message: allScheduled 
        ? "All email notification workflows scheduled successfully"
        : "Some workflows failed to schedule",
      results,
      schedules: {
        overdue: "Daily at 9:00 AM UTC - Check for overdue books and send penalty emails",
        dueToday: "Daily at 9:00 AM UTC - Send urgent reminders for books due today",
        dueDateReminders: "Daily at 8:00 AM UTC - Send reminders for books due tomorrow",
      },
      nextSteps: allScheduled 
        ? ["All workflows are now scheduled", "They will run automatically at their scheduled times", "Use /api/test-all-workflows to test manually"]
        : ["Check the errors and fix configuration issues", "Ensure QSTASH_TOKEN and RESEND_TOKEN are set", "Try running individual setup endpoints"],
    });

  } catch (error) {
    console.error("❌ Error setting up email workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to setup workflows",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email Notification Workflow Setup",
    description: "POST to this endpoint to schedule all email notification workflows",
    endpoints: {
      setupAll: "POST /api/setup-all-email-workflows",
      testAll: "POST /api/test-all-workflows", 
      individual: {
        overdue: "POST /api/setup-overdue-penalties",
        dueToday: "POST /api/setup-due-today-reminders",
        dueDateReminders: "POST /api/setup-due-date-reminders",
      }
    },
    schedules: {
      overdue: "Daily at 9:00 AM UTC - Check for overdue books and send penalty emails",
      dueToday: "Daily at 9:00 AM UTC - Send urgent reminders for books due today", 
      dueDateReminders: "Daily at 8:00 AM UTC - Send reminders for books due tomorrow",
    },
  });
}