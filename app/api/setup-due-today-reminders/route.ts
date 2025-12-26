import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "schedule" } = body;

    const qstashToken = process.env.QSTASH_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    if (!qstashToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "QStash token not configured. Please check QSTASH_TOKEN environment variable." 
        },
        { status: 400 }
      );
    }

    const qstash = new Client({ token: qstashToken });

    if (action === "schedule") {
      // Schedule daily due today reminders to run every day at 9:00 AM using QStash directly
      const scheduleId = await qstash.schedules.create({
        destination: `${baseUrl}/api/workflows/daily-due-today-reminders`,
        cron: "0 9 * * *", // Every day at 9:00 AM UTC
        body: JSON.stringify({ 
          type: "daily_due_today_check",
          scheduledAt: new Date().toISOString() 
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`✅ Scheduled daily due today reminders with Schedule ID: ${scheduleId}`);

      return NextResponse.json({
        success: true,
        message: "Daily due today reminders scheduled successfully",
        scheduleId,
        schedule: "Every day at 9:00 AM UTC",
        endpoint: `${baseUrl}/api/workflows/daily-due-today-reminders`,
        nextRun: "Next scheduled run will be at 9:00 AM UTC",
      });

    } else if (action === "trigger-now") {
      // Trigger the workflow immediately for testing
      await qstash.publishJSON({
        url: `${baseUrl}/api/workflows/daily-due-today-reminders`,
        body: { 
          type: "immediate_due_today_check",
          triggeredAt: new Date().toISOString() 
        },
      });

      console.log(`🚀 Triggered due today reminders immediately`);

      return NextResponse.json({
        success: true,
        message: "Due today reminders triggered successfully",
        type: "immediate",
        endpoint: `${baseUrl}/api/check-books-due-today`,
      });

    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Use 'schedule' or 'trigger-now'",
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("❌ Error setting up due today reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return information about the scheduled reminders
  return NextResponse.json({
    success: true,
    message: "Due today reminders system information",
    endpoints: {
      schedule: "POST /api/setup-due-today-reminders with { action: 'schedule' }",
      triggerNow: "POST /api/setup-due-today-reminders with { action: 'trigger-now' }",
      manualCheck: "GET /api/check-books-due-today",
    },
    schedule: "Every day at 9:00 AM UTC (when scheduled)",
    description: "Automatically sends urgent reminder emails to users when their books are due today",
  });
}