import { NextRequest, NextResponse } from "next/server";
import { workflowClient } from "@/lib/workflow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "schedule" } = body;

    if (action === "schedule") {
      // Schedule daily due today reminders to run every day at 9:00 AM
      const workflowRunId = await workflowClient.trigger({
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/workflows/daily-due-today-reminders`,
        cron: "0 9 * * *", // Every day at 9:00 AM UTC
      });

      console.log(`✅ Scheduled daily due today reminders with ID: ${workflowRunId}`);

      return NextResponse.json({
        success: true,
        message: "Daily due today reminders scheduled successfully",
        workflowRunId,
        schedule: "Every day at 9:00 AM UTC",
        nextRun: "Next scheduled run will be at 9:00 AM UTC",
      });

    } else if (action === "trigger-now") {
      // Trigger the workflow immediately for testing
      const workflowRunId = await workflowClient.trigger({
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/workflows/daily-due-today-reminders`,
      });

      console.log(`🚀 Triggered due today reminders immediately with ID: ${workflowRunId}`);

      return NextResponse.json({
        success: true,
        message: "Due today reminders triggered successfully",
        workflowRunId,
        type: "immediate",
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