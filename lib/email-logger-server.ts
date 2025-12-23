// Server-side email logging functions - only use on server
import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";
import { EmailLogData, getEmailStatusEmoji } from "./email-logger";

/**
 * Log email activity to the database (server-side only)
 */
export async function logEmailActivity(data: EmailLogData) {
  try {
    await db.insert(emailLogs).values({
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      emailType: data.emailType,
      status: data.status,
      subject: data.subject,
      errorMessage: data.errorMessage,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });

    console.log(`📧 Email logged: ${getEmailStatusEmoji(data.status)} ${data.emailType} email ${data.status.toLowerCase()} to: ${data.recipientEmail}`);
  } catch (error) {
    console.error("Failed to log email activity:", error);
  }
}

/**
 * Helper function to log successful email
 */
export async function logEmailSuccess(data: Omit<EmailLogData, 'status'>) {
  return logEmailActivity({
    ...data,
    status: "SENT"
  });
}

/**
 * Helper function to log failed email
 */
export async function logEmailFailure(data: Omit<EmailLogData, 'status'>) {
  return logEmailActivity({
    ...data,
    status: "FAILED"
  });
}