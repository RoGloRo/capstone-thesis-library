import { NextRequest, NextResponse } from "next/server";
import { runDailyEmailAutomation } from "@/lib/email-automation";

/**
 * Consolidated Daily Email Notifications (single canonical scheduler)
 * ------------------------------------------------------------------
 * Triggered once per day by the Vercel Cron (vercel.json "0 9 * * *") and
 * runs all three automated email jobs directly in the server process:
 *   - Due Date Reminder (dueDate = tomorrow)
 *   - Due Today         (dueDate = today)
 *   - Overdue           (dueDate < today)
 *
 * NOT triggered by QStash schedules. No internal HTTP self-fetch — the jobs
 * run in-process and share the existing email sender + email_logs dedup.
 */

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Allow the cron in production only when the request carries
 * `Authorization: Bearer <CRON_SECRET>`. Fail closed if unconfigured.
 * In non-production we permit local testing.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (!CRON_SECRET) {
    console.error(
      "[consolidated-daily-emails] CRON_SECRET is not configured in production — refusing to run."
    );
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${CRON_SECRET}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = !!(body && typeof body === "object" && (body as { dryRun?: boolean }).dryRun);

    console.log(
      `🔄 Starting consolidated daily email notifications${dryRun ? " (DRY RUN — no sends)" : ""}...`
    );

    const jobs = await runDailyEmailAutomation({ dryRun });

    const totalSent = jobs.reduce((sum, j) => sum + j.sent, 0);
    const totalSkipped = jobs.reduce((sum, j) => sum + j.skippedDuplicates, 0);
    const totalFailed = jobs.reduce((sum, j) => sum + j.failed, 0);
    const anyJobFailed = jobs.some((j) => !!j.error || j.failed > 0);

    const summary = {
      success: !anyJobFailed,
      timestamp: new Date().toISOString(),
      dryRun,
      totalSent,
      totalSkippedDuplicates: totalSkipped,
      totalFailed,
      jobs,
    };

    console.log("📊 Consolidated email notifications summary:", summary);

    return NextResponse.json(summary, { status: anyJobFailed ? 207 : 200 });
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

// Allow GET for testing/verification (informational only; same auth gate).
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    name: "Consolidated Daily Email Notifications",
    description: "Runs all automated email checks in a single cron job (in-process, email_logs dedup)",
    schedule: "Daily at 9:00 AM UTC",
    checks: [
      "Overdue book penalty emails",
      "Due today reminder emails",
      "Due tomorrow reminder emails (1 day before due)",
    ],
    endpoint: "/api/workflows/consolidated-daily-emails",
    method: "POST",
    cronSchedule: "0 9 * * *",
    security: "Requires Authorization: Bearer <CRON_SECRET> in production",
    dryRun: 'POST with { "dryRun": true } performs a no-send validation run',
  });
}
