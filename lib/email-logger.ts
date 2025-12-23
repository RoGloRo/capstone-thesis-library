// This file contains email logging utilities and types
// Database operations are handled separately to avoid client-side imports

export type EmailType = 
  | "WELCOME"
  | "ACCOUNT_APPROVAL" 
  | "ACCOUNT_REJECTION"
  | "BORROW_CONFIRMATION"
  | "DUE_REMINDER"
  | "OVERDUE_NOTICE"
  | "RETURN_CONFIRMATION"
  | "USER_ACTIVE"
  | "USER_INACTIVE"
  | "DUE_TODAY"
  | "PENALTY_NOTICE";

export type EmailStatus = "SENT" | "FAILED" | "PENDING";

export interface EmailLogData {
  recipientEmail: string;
  recipientName?: string;
  emailType: EmailType;
  status: EmailStatus;
  subject: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Get appropriate emoji for email status
 */
export function getEmailStatusEmoji(status: EmailStatus): string {
  switch (status) {
    case "SENT":
      return "✅";
    case "FAILED":
      return "⚠️";
    case "PENDING":
      return "⏳";
    default:
      return "📨";
  }
}

/**
 * Get user-friendly email type display name
 */
export function getEmailTypeDisplayName(type: EmailType): string {
  const displayNames: Record<EmailType, string> = {
    WELCOME: "Welcome Email",
    ACCOUNT_APPROVAL: "Account Approval",
    ACCOUNT_REJECTION: "Account Rejection", 
    BORROW_CONFIRMATION: "Borrow Confirmation",
    DUE_REMINDER: "Due Reminder",
    OVERDUE_NOTICE: "Overdue Notice",
    RETURN_CONFIRMATION: "Return Confirmation",
    USER_ACTIVE: "User Activated",
    USER_INACTIVE: "User Deactivated",
    DUE_TODAY: "Due Today Reminder",
    PENALTY_NOTICE: "Penalty Notice"
  };

  return displayNames[type] || type;
}