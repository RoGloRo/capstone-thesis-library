import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";
import { desc, count, eq, and, gte } from "drizzle-orm";

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  emailType: string;
  status: string;
  subject: string;
  errorMessage: string | null;
  sentAt: Date | null;
  metadata: string | null;
}

export interface EmailLogsSummary {
  totalEmails: number;
  emailsSentToday: number;
  successfulEmails: number;
  failedEmails: number;
  successRate: number;
}

/**
 * Get paginated email logs
 */
export async function getEmailLogs(limit: number = 50, offset: number = 0): Promise<EmailLog[]> {
  try {
    const logs = await db
      .select({
        id: emailLogs.id,
        recipientEmail: emailLogs.recipientEmail,
        recipientName: emailLogs.recipientName,
        emailType: emailLogs.emailType,
        status: emailLogs.status,
        subject: emailLogs.subject,
        errorMessage: emailLogs.errorMessage,
        sentAt: emailLogs.sentAt,
        metadata: emailLogs.metadata,
      })
      .from(emailLogs)
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit)
      .offset(offset);

    return logs as EmailLog[];
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return [];
  }
}

/**
 * Get email logs summary statistics
 */
export async function getEmailLogsSummary(): Promise<EmailLogsSummary> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, todayResult, successfulResult, failedResult] = await Promise.all([
      // Total emails
      db.select({ count: count() }).from(emailLogs),
      
      // Emails sent today
      db
        .select({ count: count() })
        .from(emailLogs)
        .where(gte(emailLogs.sentAt, today)),
      
      // Successful emails
      db
        .select({ count: count() })
        .from(emailLogs)
        .where(eq(emailLogs.status, "SENT")),
      
      // Failed emails
      db
        .select({ count: count() })
        .from(emailLogs)
        .where(eq(emailLogs.status, "FAILED"))
    ]);

    const totalEmails = totalResult[0]?.count || 0;
    const emailsSentToday = todayResult[0]?.count || 0;
    const successfulEmails = successfulResult[0]?.count || 0;
    const failedEmails = failedResult[0]?.count || 0;

    const successRate = totalEmails > 0 ? Math.round((successfulEmails / totalEmails) * 100) : 100;

    return {
      totalEmails,
      emailsSentToday,
      successfulEmails,
      failedEmails,
      successRate,
    };
  } catch (error) {
    console.error("Error fetching email logs summary:", error);
    return {
      totalEmails: 0,
      emailsSentToday: 0,
      successfulEmails: 0,
      failedEmails: 0,
      successRate: 0,
    };
  }
}

/**
 * Get email logs by type
 */
export async function getEmailLogsByType(emailType: string, limit: number = 20): Promise<EmailLog[]> {
  try {
    const logs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.emailType, emailType as any))
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit);

    return logs as EmailLog[];
  } catch (error) {
    console.error("Error fetching email logs by type:", error);
    return [];
  }
}

/**
 * Get recent failed emails for monitoring
 */
export async function getRecentFailedEmails(limit: number = 10): Promise<EmailLog[]> {
  try {
    const logs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.status, "FAILED"))
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit);

    return logs as EmailLog[];
  } catch (error) {
    console.error("Error fetching recent failed emails:", error);
    return [];
  }
}