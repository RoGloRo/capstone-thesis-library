# Due Today Reminder System

## Overview
The Due Today Reminder System automatically sends urgent email notifications to users when their borrowed books are due on the current day. This system works alongside the existing due date reminder system to provide timely notifications.

## Features
- **Automated Daily Checks**: Runs every day at 9:00 AM UTC via scheduled workflows
- **Urgent Email Design**: Red-themed email template to emphasize urgency
- **Complete Loan Information**: Includes user name, book details, loan dates, and current status
- **Profile Redirect Button**: Direct link to user's profile page for loan management
- **Professional Templates**: Built with React Email for consistent branding
- **Upstash Integration**: Uses QStash for reliable email delivery and Resend for sending

## System Components

### 1. Email Template
**File**: `emails/BookDueTodayEmail.tsx`
- Professional React Email component
- Urgent red-themed design
- Complete loan information display
- Action button linking to user profile
- Mobile-responsive layout

### 2. API Endpoints

#### Manual Check Endpoint
**File**: `app/api/check-books-due-today/route.ts`
- **GET/POST**: `/api/check-books-due-today`
- Manually triggers due today email checks
- Returns detailed processing results
- Useful for testing and manual operations

#### Workflow Endpoint  
**File**: `app/api/workflows/daily-due-today-reminders/route.ts`
- **POST**: `/api/workflows/daily-due-today-reminders`
- Automated workflow for scheduled execution
- Processes all books due today
- Includes error handling and logging

#### Scheduling Setup
**File**: `app/api/setup-due-today-reminders/route.ts`
- **POST**: `/api/setup-due-today-reminders`
- Sets up automated daily scheduling
- Can trigger immediate execution for testing
- Returns workflow run IDs and schedule information

#### Test Helper
**File**: `app/api/test-helpers/set-due-today/route.ts`
- **POST**: `/api/test-helpers/set-due-today`
- Testing utility to set books as due today
- Can also set books as due tomorrow
- Resets reminder sent status for testing

### 3. Database Integration
- Queries `borrow_records` table for books due today
- Joins with `users` and `books` tables for complete information
- Filters by `status = 'BORROWED'` and `dueDate = today`
- Uses existing database schema and relationships

## Email Content Structure

### Header Section
- Smart Library branding with urgent red theme
- "Book Due Today" subtitle
- Professional typography

### Urgent Alert Box
- Prominent red-bordered alert box
- "URGENT: Book Due Today!" message
- Clear call to action

### Book Information
- Book title and author
- Formatted in easily readable layout
- Highlighted in separate section

### Loan Details
- Borrowed date
- Due date (highlighted as "Today")
- Loan duration in days
- Current status: "Due Today"

### Action Section
- Clear instructions for return/renewal
- Prominent "View My Profile & Loans" button
- Direct link to user's profile page

### Footer
- Contact information
- Automated system disclaimer
- Professional signature

## Setup Instructions

### 1. Environment Variables Required
```env
RESEND_TOKEN=your_resend_api_token
QSTASH_TOKEN=your_upstash_qstash_token
QSTASH_URL=your_upstash_qstash_url
NEXT_PUBLIC_BASE_URL=your_app_base_url
```

### 2. Schedule Automatic Reminders
```bash
# POST request to setup endpoint
curl -X POST http://your-app-url/api/setup-due-today-reminders \
  -H "Content-Type: application/json" \
  -d '{"action": "schedule"}'
```

### 3. Manual Testing
```bash
# Check for books due today manually
curl -X GET http://your-app-url/api/check-books-due-today

# Trigger reminders immediately
curl -X POST http://your-app-url/api/setup-due-today-reminders \
  -H "Content-Type: application/json" \
  -d '{"action": "trigger-now"}'

# Set a book as due today for testing
curl -X POST http://your-app-url/api/test-helpers/set-due-today \
  -H "Content-Type: application/json" \
  -d '{"borrowRecordId": "your-record-id", "action": "set-due-today"}'
```

## Automated Schedule
- **Frequency**: Daily at 9:00 AM UTC
- **Cron Expression**: `"0 9 * * *"`
- **Execution**: Via Upstash QStash workflow scheduling
- **Reliability**: Automatic retries and error handling included

## Error Handling
- **Email Failures**: Logged but don't stop processing of other records
- **Database Errors**: Proper error responses and logging
- **Missing Environment Variables**: Graceful degradation with detailed logging
- **Workflow Failures**: Automatic retries via Upstash QStash

## Integration with Existing System
- **Complementary**: Works alongside existing due date reminder system
- **Database Schema**: Uses existing tables without modifications
- **Email Templates**: Consistent styling with other system emails
- **Environment**: Shares same configuration and deployment setup

## Monitoring and Logging
- **Console Logging**: Detailed logs for each step of the process
- **Email Counters**: Tracks sent, failed, and skipped emails
- **Workflow Logs**: Upstash provides detailed execution logs
- **Error Tracking**: Full error messages and stack traces logged

## Testing Strategy

### 1. Unit Testing Email Template
- Test email rendering with various data
- Verify responsive design
- Check all links and buttons

### 2. Integration Testing API Endpoints
- Test manual check endpoint
- Verify workflow execution
- Test scheduling setup

### 3. End-to-End Testing
- Create test borrow records due today
- Trigger reminders manually
- Verify email delivery
- Check database updates

### 4. Production Validation
- Monitor first few scheduled runs
- Verify email delivery rates
- Check for any errors or failures
- Validate user experience

## Deployment Checklist
- [ ] Environment variables configured
- [ ] Email templates tested
- [ ] Database schema verified
- [ ] Workflow scheduling set up
- [ ] Monitoring and logging in place
- [ ] Test emails sent successfully
- [ ] Production schedule activated
- [ ] Error handling verified
- [ ] Documentation updated
- [ ] Team trained on system operation

## Usage Examples

### Email Subject Lines
- `🚨 URGENT: "The Great Gatsby" is due TODAY!`
- `🚨 URGENT: "To Kill a Mockingbird" is due TODAY!`

### Typical Workflow
1. System runs daily at 9:00 AM UTC
2. Queries database for books due today
3. Generates personalized email for each user
4. Sends emails via Resend API
5. Logs results and any errors
6. Updates tracking if needed

### Response Handling
- **Success**: Email sent, user notified
- **User Action**: User visits profile, renews or returns book
- **Follow-up**: System continues monitoring until book returned

## Future Enhancements
- Multiple reminders throughout the day for overdue books
- SMS notifications for urgent reminders
- Push notifications via web app
- Integration with library renewal systems
- Customizable reminder schedules per user
- Analytics dashboard for reminder effectiveness