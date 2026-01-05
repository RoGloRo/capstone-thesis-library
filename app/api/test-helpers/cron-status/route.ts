import { NextRequest, NextResponse } from "next/server";

/**
 * Cron Job Status Check
 * This endpoint helps verify if Vercel cron jobs are properly configured and running
 */
export async function GET(request: NextRequest) {
  try {
    const cronJobs = [
      {
        name: "Consolidated Daily Emails",
        path: "/api/workflows/consolidated-daily-emails",
        schedule: "0 9 * * *",
        description: "Runs overdue, due today, and due tomorrow email notifications",
        nextRun: "Daily at 9:00 AM UTC",
      }
    ];

    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      hasQStashToken: !!process.env.QSTASH_TOKEN,
      hasResendToken: !!process.env.RESEND_TOKEN,
      isProduction: process.env.NODE_ENV === 'production',
    };

    // Check if we're in a proper production environment
    const isConfiguredForProduction = 
      environment.isProduction &&
      environment.NEXT_PUBLIC_BASE_URL && 
      !environment.NEXT_PUBLIC_BASE_URL.includes('localhost') &&
      environment.hasQStashToken &&
      environment.hasResendToken;

    const warnings = [];
    
    if (!environment.hasQStashToken) {
      warnings.push("QSTASH_TOKEN is missing - emails won't send");
    }
    
    if (!environment.hasResendToken) {
      warnings.push("RESEND_TOKEN is missing - emails won't send");
    }
    
    if (!environment.NEXT_PUBLIC_BASE_URL) {
      warnings.push("NEXT_PUBLIC_BASE_URL is missing");
    } else if (environment.NEXT_PUBLIC_BASE_URL.includes('localhost')) {
      warnings.push("NEXT_PUBLIC_BASE_URL is set to localhost - update for production");
    }

    if (!environment.isProduction) {
      warnings.push("Not in production environment - cron jobs won't run automatically");
    }

    return NextResponse.json({
      status: "Cron job configuration check",
      timestamp: new Date().toISOString(),
      cronJobs,
      environment,
      isConfiguredForProduction,
      warnings,
      recommendations: [
        "Ensure NEXT_PUBLIC_BASE_URL is set to https://capstone-thesis-library.vercel.app in Vercel Dashboard",
        "Verify QSTASH_TOKEN and RESEND_TOKEN are set in Vercel environment variables",
        "Check Vercel Dashboard → Settings → Cron Jobs to see if cron is registered",
        "Cron jobs only run in production, not in preview deployments",
      ],
      testEndpoints: {
        manual: "POST /api/workflows/consolidated-daily-emails",
        diagnostic: "GET /api/test-helpers/automated-emails-diagnostic",
      }
    });

  } catch (error) {
    console.error("❌ Cron status check failed:", error);
    return NextResponse.json(
      {
        error: "Failed to check cron status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json().catch(() => ({ action: 'check' }));
    
    if (action === 'test-manual-trigger') {
      // Test the consolidated email endpoint
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      
      const response = await fetch(`${baseUrl}/api/workflows/consolidated-daily-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      return NextResponse.json({
        test: "Manual trigger test",
        success: response.ok,
        result,
        timestamp: new Date().toISOString(),
      });
    }
    
    return NextResponse.json({
      message: "Use GET to check cron status, or POST with { action: 'test-manual-trigger' } to test email sending",
    });

  } catch (error) {
    console.error("❌ Cron test failed:", error);
    return NextResponse.json(
      {
        error: "Cron test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}