import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/test/notifications
 * Test endpoint to see all email logs (for development only)
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Build query conditionally
    const logs = email 
      ? await db
          .select({
            id: emailLogs.id,
            recipientEmail: emailLogs.recipientEmail,
            recipientName: emailLogs.recipientName,
            emailType: emailLogs.emailType,
            status: emailLogs.status,
            subject: emailLogs.subject,
            sentAt: emailLogs.sentAt,
            metadata: emailLogs.metadata,
          })
          .from(emailLogs)
          .where(eq(emailLogs.recipientEmail, email))
          .limit(limit)
      : await db
          .select({
            id: emailLogs.id,
            recipientEmail: emailLogs.recipientEmail,
            recipientName: emailLogs.recipientName,
            emailType: emailLogs.emailType,
            status: emailLogs.status,
            subject: emailLogs.subject,
            sentAt: emailLogs.sentAt,
            metadata: emailLogs.metadata,
          })
          .from(emailLogs)
          .limit(limit);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });

  } catch (error) {
    console.error("Error fetching test notifications:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}