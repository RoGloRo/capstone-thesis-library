import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

export async function POST(request: NextRequest) {
  try {
    const qstashToken = process.env.QSTASH_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    
    if (!qstashToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "QStash token not configured" 
        },
        { status: 400 }
      );
    }

    const qstash = new Client({ token: qstashToken });

    // Schedule daily overdue penalty checks at 9:00 AM
    const scheduleId = await qstash.schedules.create({
      destination: `${baseUrl}/api/workflows/daily-overdue-penalties`,
      cron: "0 9 * * *", // Daily at 9:00 AM
      body: JSON.stringify({ 
        type: "daily_overdue_penalty_check",
        scheduledAt: new Date().toISOString() 
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Overdue penalty reminder schedule created:", scheduleId);

    return NextResponse.json({
      success: true,
      message: "Daily overdue penalty reminders scheduled successfully",
      scheduleId,
      schedule: "Daily at 9:00 AM",
      endpoint: `${baseUrl}/api/workflows/daily-overdue-penalties`,
    });

  } catch (error) {
    console.error("❌ Error setting up overdue penalty reminders:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to setup overdue penalty reminders" 
      },
      { status: 500 }
    );
  }
}