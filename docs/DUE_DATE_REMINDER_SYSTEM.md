# Due Date Reminder Email System

## Overview

The due date reminder system automatically sends email notifications to users one day before their borrowed books are due for return. This system helps reduce overdue books and improves the library's return rate.

## System Architecture

```
Scheduled Job (Cron/Manual)
       ↓
/api/check-due-date-reminders
       ↓
Query Books Due Tomorrow
       ↓
For Each Book:
  ├── Render Email Template
  ├── Send Email via Resend
  └── Mark Reminder as Sent
       ↓
Return Processing Results
```

## Components Implemented

### 1. Email Template (`emails/DueDateReminderEmail.tsx`)
- **Urgent Design**: Red color scheme to indicate urgency
- **Book Details**: Title, author, and due date prominently displayed
- **Clear Call-to-Action**: Button linking to user's profile/borrowed books
- **Return Options**: Multiple ways to return the book
- **Professional Layout**: Responsive design with library branding

### 2. Database Schema Update (`database/schema.ts`)
```sql
-- Added to borrow_records table:
due_date_reminder_sent BOOLEAN DEFAULT false
```
This field prevents duplicate reminder emails for the same borrow record.

### 3. Workflow API Route (`app/api/workflows/due-date-reminder/route.ts`)
- **Asynchronous Processing**: Uses Upstash QStash for reliable delivery
- **Email Rendering**: Converts React Email template to HTML
- **Error Handling**: Robust error handling with logging

### 4. Scheduled Check Endpoint (`app/api/check-due-date-reminders/route.ts`)
- **Date Calculation**: Finds books due exactly tomorrow
- **Duplicate Prevention**: Only sends reminders to books that haven't received them
- **Batch Processing**: Handles multiple reminders efficiently
- **Detailed Reporting**: Returns comprehensive results with success/error counts

### 5. Test Helper (`app/api/test-helpers/set-due-date/route.ts`)
- **Testing Support**: Allows setting custom due dates for testing
- **Development Tool**: Helps verify reminder functionality

## API Endpoints

### Check Due Date Reminders
**POST** `/api/check-due-date-reminders`

Scans for books due tomorrow and sends reminder emails.

**Response:**
```json
{
  "success": true,
  "message": "Due date reminder check completed",
  "results": {
    "processed": 1,
    "sent": 1,
    "errors": 0,
    "details": [
      {
        "borrowRecordId": "uuid",
        "userEmail": "user@example.com",
        "bookTitle": "Book Title",
        "status": "sent"
      }
    ]
  }
}
```

### Set Due Date (Testing)
**POST** `/api/test-helpers/set-due-date`

**Request Body:**
```json
{
  "borrowRecordId": "uuid",
  "daysFromNow": 1
}
```

## Email Content Structure

### Header
- Smart Library branding
- Urgent "Book Due Tomorrow!" title in red

### Main Content
- Personalized greeting
- Book information with visual book icon
- Highlighted due date in warning box
- Important reminder about late fees

### Call-to-Action
- Red button linking to user's profile
- "View My Borrowed Books" action

### Return Options
- Online return via profile
- In-person return at library desk

## Deployment and Scheduling

### Manual Trigger
```bash
# Test the reminder system
curl -X POST http://localhost:3000/api/check-due-date-reminders
```

### Automated Scheduling Options

#### 1. Cron Job (Server-based)
```bash
# Run daily at 9 AM to check for books due tomorrow
0 9 * * * curl -X POST https://your-domain.com/api/check-due-date-reminders
```

#### 2. Upstash QStash Scheduler
```javascript
// Schedule daily reminders
await qstashClient.publishJSON({
  url: "https://your-domain.com/api/check-due-date-reminders",
  method: "POST",
  delay: "1d", // Run daily
});
```

#### 3. Vercel Cron Jobs
```json
// In vercel.json
{
  "crons": [
    {
      "path": "/api/check-due-date-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Features

### ✅ **Implemented**
- Automated email reminders one day before due date
- Professional email template with urgent styling
- Duplicate prevention (database tracking)
- Batch processing for multiple reminders
- Comprehensive error handling and logging
- Development/production environment support
- Test utilities for development

### 🔄 **Production Considerations**
- Deploy with proper database migration for `dueDateReminderSent` field
- Set up automated scheduling (cron jobs or Vercel cron)
- Configure proper external URL for production workflows
- Monitor email delivery rates and errors

### 🚀 **Future Enhancements**
- Multiple reminder intervals (1 day, 3 days before)
- Overdue book notifications
- User preference settings for reminder frequency
- SMS reminders as alternative to email
- Analytics dashboard for reminder effectiveness

## Testing

The system has been tested and successfully:
1. ✅ Found books due tomorrow from the database
2. ✅ Generated personalized reminder emails
3. ✅ Sent emails via Resend API
4. ✅ Returned detailed processing results
5. ✅ Handled error cases gracefully

## Configuration Requirements

Ensure these environment variables are set:
- `RESEND_TOKEN`: For sending emails
- `QSTASH_TOKEN`: For workflow processing
- `NEXT_PUBLIC_BASE_URL`: For profile links in emails
- `DATABASE_URL`: For accessing borrow records

## Files Created/Modified

### Created Files:
1. `emails/DueDateReminderEmail.tsx` - Email template
2. `app/api/workflows/due-date-reminder/route.ts` - Workflow handler
3. `app/api/check-due-date-reminders/route.ts` - Main scheduler endpoint
4. `app/api/test-helpers/set-due-date/route.ts` - Testing utility

### Modified Files:
1. `database/schema.ts` - Added `dueDateReminderSent` field

The due date reminder system is now fully functional and ready for production deployment with proper scheduling configuration.