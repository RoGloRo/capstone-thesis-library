# Email Activity Logging System

This system provides comprehensive email activity tracking for the Smart Library application, allowing administrators to monitor all email notifications sent by the system.

## Features

- **Real-time Email Logging**: Automatically logs all email activities with status tracking
- **Admin Dashboard**: View email logs with filtering, searching, and summary statistics
- **Error Tracking**: Monitor failed emails with detailed error messages
- **Email Type Classification**: Categorizes emails by type (Welcome, Due Reminders, etc.)
- **Integration-Ready**: Easy to integrate with existing email workflows

## Database Schema

The system uses an `email_logs` table with the following structure:

```sql
CREATE TABLE "email_logs" (
  "id" uuid PRIMARY KEY,
  "recipient_email" text NOT NULL,
  "recipient_name" varchar(255),
  "email_type" email_type NOT NULL,
  "status" email_status DEFAULT 'SENT',
  "subject" text NOT NULL,
  "error_message" text,
  "sent_at" timestamp with time zone DEFAULT now(),
  "metadata" text -- JSON string for additional data
);
```

### Email Types
- `WELCOME` - New user welcome emails
- `ACCOUNT_APPROVAL` - Account approval notifications
- `ACCOUNT_REJECTION` - Account rejection notifications
- `BORROW_CONFIRMATION` - Book borrowing confirmations
- `DUE_REMINDER` - Due date reminders
- `OVERDUE_NOTICE` - Overdue book notifications
- `RETURN_CONFIRMATION` - Book return confirmations
- `USER_ACTIVE` - User activity notifications
- `USER_INACTIVE` - User inactivity notifications
- `DUE_TODAY` - Same-day due reminders
- `PENALTY_NOTICE` - Penalty notifications

### Email Statuses
- `SENT` - Email sent successfully
- `FAILED` - Email sending failed
- `PENDING` - Email queued for sending

## Setup Instructions

### 1. Database Migration
Run the migration to create the email logs table:

```bash
# If using Drizzle
npx drizzle-kit push:pg

# Or run the migration file directly
psql -d your_database -f migrations/0008_add_email_logs.sql
```

### 2. Seed Sample Data (Optional)
To populate the database with sample email logs for testing:

```bash
npx ts-node database/seed-email-logs.ts
```

### 3. Access the Admin Page
Navigate to `/admin/email-logs` in your application (admin access required).

## Integration Guide

### Option 1: Enhanced Email Functions (Recommended)
Use the pre-built enhanced email functions that include automatic logging:

```typescript
import { 
  sendWelcomeEmail,
  sendBorrowConfirmationEmail,
  sendDueReminderEmail 
} from "@/lib/email-with-logging";

// Example: Send welcome email with automatic logging
await sendWelcomeEmail(
  user.email, 
  user.fullName, 
  emailHtml
);

// Example: Send borrow confirmation with logging
await sendBorrowConfirmationEmail(
  user.email,
  user.fullName,
  emailHtml,
  book.title,
  book.author
);
```

### Option 2: Manual Integration
Integrate logging into existing email workflows:

```typescript
import { sendEmail } from "@/lib/workflow";
import { logEmailSuccess, logEmailFailure } from "@/lib/email-logger";

try {
  await sendEmail({
    email: user.email,
    subject: "Welcome to Smart Library!",
    message: emailHtml,
  });

  // Log successful email
  await logEmailSuccess({
    recipientEmail: user.email,
    recipientName: user.fullName,
    emailType: "WELCOME",
    subject: "Welcome to Smart Library!",
    metadata: { userType: "new_user" }
  });

} catch (error) {
  // Log failed email
  await logEmailFailure({
    recipientEmail: user.email,
    recipientName: user.fullName,
    emailType: "WELCOME",
    subject: "Welcome to Smart Library!",
    errorMessage: error.message,
    metadata: { userType: "new_user" }
  });
}
```

### Option 3: Wrapper Function
Use the wrapper function for custom integrations:

```typescript
import { sendEmailWithLogging } from "@/lib/email-with-logging";

await sendEmailWithLogging({
  email: user.email,
  subject: "Custom Email Subject",
  message: emailHtml,
  emailType: "WELCOME",
  recipientName: user.fullName,
  metadata: { 
    customField: "value",
    timestamp: new Date().toISOString() 
  }
});
```

## Migration from Existing Code

### Before (Example from existing codebase):
```typescript
await sendEmail({
  email: user.email,
  subject: "Welcome to Smart Library!",
  message: emailHtml,
});
```

### After (With logging):
```typescript
await sendWelcomeEmail(user.email, user.fullName, emailHtml);
```

## Admin Dashboard Features

### Summary Statistics
- Total emails sent
- Emails sent today
- Success/failure counts
- Success rate percentage

### Email Logs Table
- Real-time email activity display
- Search by email, name, or subject
- Filter by email type and status
- Detailed error messages for failed emails
- Timestamp information with relative times

### Filtering Options
- **Status Filter**: All, Sent, Failed, Pending
- **Type Filter**: All email types or specific categories
- **Search**: Full-text search across emails, names, and subjects

## API Endpoints

The system doesn't expose direct API endpoints but provides utility functions for integration:

### Logging Functions
- `logEmailActivity(data)` - Log any email activity
- `logEmailSuccess(data)` - Log successful email
- `logEmailFailure(data)` - Log failed email

### Query Functions  
- `getEmailLogs(limit, offset)` - Get paginated email logs
- `getEmailLogsSummary()` - Get summary statistics
- `getEmailLogsByType(type, limit)` - Get logs by email type
- `getRecentFailedEmails(limit)` - Get recent failed emails

## Console Logging

The system provides helpful console output for debugging:

```
✅ Email sent and logged: WELCOME to user@example.com
📧 Email logged: ✅ WELCOME email sent to: user@example.com
❌ Email failed and logged: DUE_REMINDER to user@example.com
📧 Email logged: ⚠️ DUE_REMINDER email failed to: user@example.com
```

## Best Practices

1. **Always Use Logging**: Integrate email logging into all email workflows
2. **Include Metadata**: Add relevant metadata for better tracking and debugging
3. **Handle Errors Gracefully**: Log failures but don't let email errors break core functionality
4. **Monitor Regularly**: Check the admin dashboard for failed emails and system health
5. **Clean Up Old Logs**: Consider implementing log retention policies for large-scale applications

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure database connection is properly configured
2. **Missing Email Logs**: Verify that email functions are using the logging wrapper
3. **Permission Issues**: Confirm admin role access for the dashboard
4. **Date Formatting**: Ensure proper timezone handling for accurate timestamps

### Debug Mode
Enable detailed logging by checking console output for email operations.

## Future Enhancements

- Email template previews in admin dashboard
- Email retry functionality for failed sends
- Advanced analytics and reporting
- Email delivery tracking with webhooks
- Bulk email operations monitoring
- User-specific email preferences and history