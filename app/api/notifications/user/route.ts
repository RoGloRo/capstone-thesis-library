import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export interface UserNotification {
  id: string;
  emailType: string;
  subject: string;
  sentAt: Date | null;
  status: string;
  metadata: string | null;
}

/**
 * GET /api/notifications/user
 * Fetch notifications (email logs) for the current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate limit
    if (limit > 50) {
      return NextResponse.json(
        { error: "Limit cannot exceed 50" },
        { status: 400 }
      );
    }

    // Fetch email logs for the current user only
    const userNotifications = await db
      .select({
        id: emailLogs.id,
        emailType: emailLogs.emailType,
        subject: emailLogs.subject,
        sentAt: emailLogs.sentAt,
        status: emailLogs.status,
        metadata: emailLogs.metadata,
      })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.recipientEmail, session.user.email),
          eq(emailLogs.status, "SENT") // Only show successfully sent emails
        )
      )
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit);

    // Transform the data for better client consumption
    const notifications: UserNotification[] = userNotifications.map(log => ({
      id: log.id,
      emailType: log.emailType,
      subject: log.subject || "Email Notification",
      sentAt: log.sentAt,
      status: log.status,
      metadata: log.metadata,
    }));

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      userEmail: session.user.email, // For debugging (remove in production)
    });

  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return NextResponse.json(
      { 
        error: "Internal server error while fetching notifications",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}