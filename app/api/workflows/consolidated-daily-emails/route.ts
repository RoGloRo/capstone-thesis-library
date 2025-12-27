import { NextRequest, NextResponse } from "next/server";

/**
 * Consolidated Daily Email Notifications
 * Runs all automated email checks in a single cron job
 * Triggered once per day to handle: overdue books, due today, and due tomorrow reminders
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting consolidated daily email notifications...");
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const results = {
      overdueEmails: { success: false, message: "", emailsSent: 0 },
      dueTodayEmails: { success: false, message: "", emailsSent: 0 },
      dueTomorrowEmails: { success: false, message: "", emailsSent: 0 },
    };

    // 1. Check and send overdue book penalty emails
    try {
      console.log("📧 Running overdue book penalties...");
      const overdueResponse = await fetch(`${baseUrl}/api/workflows/daily-overdue-penalties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const overdueData = await overdueResponse.json();
      results.overdueEmails = {
        success: overdueResponse.ok,
        message: overdueData.message || "Overdue emails processed",
        emailsSent: overdueData.emailsSent || 0,
      };
      
      console.log(`✅ Overdue penalties: ${results.overdueEmails.emailsSent} emails sent`);
    } catch (error) {
      console.error("❌ Overdue emails failed:", error);
      results.overdueEmails = {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process overdue emails",
        emailsSent: 0,
      };
    }

    // 2. Check and send due today reminder emails
    try {
      console.log("📧 Running due today reminders...");
      const dueTodayResponse = await fetch(`${baseUrl}/api/workflows/daily-due-today-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const dueTodayData = await dueTodayResponse.json();
      results.dueTodayEmails = {
        success: dueTodayResponse.ok,
        message: dueTodayData.message || "Due today emails processed",
        emailsSent: dueTodayData.emailsSent || 0,
      };
      
      console.log(`✅ Due today reminders: ${results.dueTodayEmails.emailsSent} emails sent`);
    } catch (error) {
      console.error("❌ Due today emails failed:", error);
      results.dueTodayEmails = {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process due today emails",
        emailsSent: 0,
      };
    }

    // 3. Check and send due tomorrow reminder emails
    try {
      console.log("📧 Running due tomorrow reminders...");
      const dueTomorrowResponse = await fetch(`${baseUrl}/api/check-due-date-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const dueTomorrowData = await dueTomorrowResponse.json();
      results.dueTomorrowEmails = {
        success: dueTomorrowResponse.ok,
        message: dueTomorrowData.message || "Due tomorrow emails processed",
        emailsSent: dueTomorrowData.sent || 0,
      };
      
      console.log(`✅ Due tomorrow reminders: ${results.dueTomorrowEmails.emailsSent} emails sent`);
    } catch (error) {
      console.error("❌ Due tomorrow emails failed:", error);
      results.dueTomorrowEmails = {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process due tomorrow emails",
        emailsSent: 0,
      };
    }

    // Calculate totals
    const totalEmailsSent = 
      results.overdueEmails.emailsSent + 
      results.dueTodayEmails.emailsSent + 
      results.dueTomorrowEmails.emailsSent;

    const allSuccessful = 
      results.overdueEmails.success && 
      results.dueTodayEmails.success && 
      results.dueTomorrowEmails.success;

    const summary = {
      success: allSuccessful,
      timestamp: new Date().toISOString(),
      totalEmailsSent,
      details: results,
      message: `Consolidated email notifications completed. Sent ${totalEmailsSent} total emails.`,
    };

    console.log("📊 Consolidated email notifications summary:", summary);

    return NextResponse.json(summary, { 
      status: allSuccessful ? 200 : 207 // 207 = Multi-Status (partial success)
    });

  } catch (error) {
    console.error("❌ Consolidated email notifications failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run consolidated email notifications",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing/verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: "Consolidated Daily Email Notifications",
    description: "Runs all automated email checks in a single cron job",
    schedule: "Daily at 9:00 AM UTC",
    checks: [
      "Overdue book penalty emails",
      "Due today reminder emails", 
      "Due tomorrow reminder emails (1 day before due)",
    ],
    endpoint: "/api/workflows/consolidated-daily-emails",
    method: "POST",
    cronSchedule: "0 9 * * *",
  });
}