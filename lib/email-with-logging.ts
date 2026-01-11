import { sendEmail as originalSendEmail } from "@/lib/workflow";
import { logEmailSuccess, logEmailFailure } from "@/lib/email-logger-server";
import { EmailType } from "@/lib/email-logger";

interface EnhancedEmailData {
  email: string;
  subject: string;
  message: string;
  emailType: EmailType;
  recipientName?: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced sendEmail function that includes logging
 * This wraps the original sendEmail with email activity logging
 */
export async function sendEmailWithLogging(data: EnhancedEmailData) {
  const { email, subject, message, emailType, recipientName, metadata } = data;

  try {
    // Send the email using the original function
    await originalSendEmail({
      email,
      subject,
      message,
    });

    // Log successful email
    await logEmailSuccess({
      recipientEmail: email,
      recipientName,
      emailType,
      subject,
      metadata,
    });

    console.log(`✅ Email sent and logged: ${emailType} to ${email}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log failed email
    await logEmailFailure({
      recipientEmail: email,
      recipientName,
      emailType,
      subject,
      errorMessage,
      metadata,
    });

    console.error(`❌ Email failed and logged: ${emailType} to ${email}`, error);
    
    // Re-throw the error so the calling code can handle it
    throw error;
  }
}

/**
 * Convenience functions for common email types
 */

export async function sendWelcomeEmail(email: string, userName: string, message: string) {
  return sendEmailWithLogging({
    email,
    subject: "Welcome to Smart Library! 👋 Your reading journey begins now",
    message,
    emailType: "WELCOME",
    recipientName: userName,
    metadata: { userType: "new_user" }
  });
}

export async function sendAccountApprovalEmail(email: string, userName: string, message: string) {
  return sendEmailWithLogging({
    email,
    subject: "🎉 Your Smart Library account has been approved!",
    message,
    emailType: "ACCOUNT_APPROVAL",
    recipientName: userName,
    metadata: { approvalDate: new Date().toISOString() }
  });
}

export async function sendAccountRejectionEmail(email: string, userName: string, message: string) {
  return sendEmailWithLogging({
    email,
    subject: "Smart Library Account Registration Update",
    message,
    emailType: "ACCOUNT_REJECTION",
    recipientName: userName,
    metadata: { rejectionDate: new Date().toISOString() }
  });
}

export async function sendBorrowConfirmationEmail(
  email: string, 
  userName: string, 
  message: string, 
  bookTitle: string,
  bookAuthor: string
) {
  return sendEmailWithLogging({
    email,
    subject: `📚 Book Borrowed: ${bookTitle}`,
    message,
    emailType: "BORROW_CONFIRMATION",
    recipientName: userName,
    metadata: { 
      bookTitle, 
      bookAuthor,
      borrowDate: new Date().toISOString() 
    }
  });
}

export async function sendDueReminderEmail(
  email: string,
  userName: string,
  message: string,
  bookTitle: string,
  extraMetadata?: Record<string, any>
) {
  return sendEmailWithLogging({
    email,
    subject: `⏰ Reminder: "${bookTitle}" is due tomorrow!`,
    message,
    emailType: "DUE_REMINDER",
    recipientName: userName,
    metadata: {
      bookTitle,
      reminderType: "one_day_before",
      ...(extraMetadata || {}),
    },
  });
}

export async function sendOverdueNoticeEmail(
  email: string,
  userName: string,
  message: string,
  bookTitle: string,
  daysOverdue: number,
  extraMetadata?: Record<string, any>
) {
  return sendEmailWithLogging({
    email,
    subject: `⚠️ OVERDUE: ${bookTitle} - Immediate Return Required`,
    message,
    emailType: "OVERDUE_NOTICE",
    recipientName: userName,
    metadata: {
      bookTitle,
      daysOverdue,
      noticeDate: new Date().toISOString(),
      ...(extraMetadata || {}),
    },
  });
}

export async function sendReturnConfirmationEmail(
  email: string, 
  userName: string, 
  message: string, 
  bookTitle: string
) {
  return sendEmailWithLogging({
    email,
    subject: `📚 Book Returned Successfully: ${bookTitle}`,
    message,
    emailType: "RETURN_CONFIRMATION",
    recipientName: userName,
    metadata: { 
      bookTitle,
      returnDate: new Date().toISOString()
    }
  });
}

export async function sendDueTodayEmail(
  email: string,
  userName: string,
  message: string,
  bookTitle: string,
  extraMetadata?: Record<string, any>
) {
  return sendEmailWithLogging({
    email,
    subject: `🚨 URGENT: "${bookTitle}" is due TODAY!`,
    message,
    emailType: "DUE_TODAY",
    recipientName: userName,
    metadata: {
      bookTitle,
      urgencyLevel: "high",
      ...(extraMetadata || {}),
    },
  });
}