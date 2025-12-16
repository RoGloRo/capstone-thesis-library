# Overdue Book Penalty Email System

## 🎯 Overview

The **Overdue Book Penalty Email System** is an automated notification feature that sends urgent penalty notices to users who have overdue books. This system helps maintain library accountability and encourages timely book returns through professional, branded email communications.

## 📧 Email Features

### Professional Design
- **Urgent Red Theme**: Uses red color scheme to emphasize urgency
- **Clear Status Indicators**: Visual overdue warnings and penalty information  
- **Professional Branding**: Consistent with library system design
- **Mobile Responsive**: Optimized for all devices

### Content Elements
- **User Personalization**: Addressed to specific user by name
- **Book Details**: Title, author, and loan information
- **Overdue Metrics**: Days overdue and calculated penalty amounts
- **Action Required Section**: Clear instructions for immediate action
- **Return Button**: Prominent "Return Book Now" call-to-action

## 🔧 System Components

### 1. Email Template (`emails/OverdueBookEmail.tsx`)
```typescript
// React Email component with red urgency theme
<OverdueBookEmail 
  userName="John Doe"
  bookTitle="Advanced React Patterns" 
  bookAuthor="Kent C. Dodds"
  borrowDate="December 1, 2025"
  dueDate="December 8, 2025"
  daysOverdue={3}
  penaltyAmount={1.50}
  returnBookUrl="http://localhost:3001/my-profile"
/>
```

### 2. API Endpoints

#### Manual Check: `/api/check-overdue-books`
- **Method**: POST
- **Purpose**: Manual trigger for overdue penalty emails
- **Features**: 
  - Finds all overdue books without penalty notifications
  - Calculates penalties ($0.50 per day)
  - Sends penalty emails via Upstash QStash + Resend
  - Marks records as penalty notification sent

#### Automated Workflow: `/api/workflows/daily-overdue-penalties`  
- **Method**: POST  
- **Purpose**: Daily automated overdue penalty processing
- **Schedule**: Runs daily at 9:00 AM via QStash cron job
- **Features**: Same as manual check but fully automated

#### Setup Automation: `/api/setup-overdue-penalties`
- **Method**: POST
- **Purpose**: Initialize daily overdue penalty schedule
- **Schedule**: Creates QStash cron job: `"0 9 * * *"` (9:00 AM daily)

### 3. Testing Endpoints

#### Make Book Overdue: `/api/test-helpers/set-overdue`
```json
POST /api/test-helpers/set-overdue
{
  "bookTitle": "JavaScript: The Good Parts",
  "daysOverdue": 5
}
```

#### Test Penalty Email: `/api/test-overdue-penalty` 
```json
POST /api/test-overdue-penalty
{
  "userEmail": "user@example.com" // Optional
}
```

## 📊 Database Integration

### New Field: `overdue_penalty_sent`
```sql
ALTER TABLE "borrow_records" 
ADD COLUMN "overdue_penalty_sent" boolean DEFAULT false;
```

**Purpose**: Tracks whether overdue penalty notification has been sent
**Benefits**: Prevents duplicate penalty emails for same overdue period

### Query Logic
```sql
-- Find overdue books needing penalty notifications
WHERE (
  borrow_records.status = 'BORROWED' AND
  borrow_records.due_date < CURRENT_DATE AND  
  borrow_records.overdue_penalty_sent = false AND
  borrow_records.return_date IS NULL
)
```

## 💰 Penalty Calculation

### Formula
```typescript
const penaltyPerDay = 0.50; // $0.50 per day overdue
const daysOverdue = Math.ceil(
  (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
);
const penaltyAmount = daysOverdue * penaltyPerDay;
```

### Examples
- **1 day overdue**: $0.50 penalty
- **3 days overdue**: $1.50 penalty  
- **7 days overdue**: $3.50 penalty
- **14 days overdue**: $7.00 penalty

## 🔄 Workflow Integration

### Automated Process
1. **Daily Trigger**: QStash cron job runs at 9:00 AM
2. **Query Overdue**: Find books past due date without penalty notification
3. **Calculate Penalties**: Determine days overdue and penalty amounts
4. **Send Emails**: Render email template and send via Resend API
5. **Mark Sent**: Update `overdue_penalty_sent = true` to prevent duplicates
6. **Logging**: Comprehensive console logging for monitoring

### Email Service Stack
- **Upstash QStash**: Reliable background job processing
- **Resend API**: Professional email delivery service  
- **React Email**: Type-safe, responsive email templates

## 📋 Testing Instructions

### 1. Setup Automated Schedule
```bash
curl -X POST http://localhost:3001/api/setup-overdue-penalties
```

### 2. Create Test Overdue Book
```bash
curl -X POST http://localhost:3001/api/test-helpers/set-overdue \
  -H "Content-Type: application/json" \
  -d '{"bookTitle": "Test Book", "daysOverdue": 3}'
```

### 3. Send Test Penalty Email
```bash  
curl -X POST http://localhost:3001/api/test-overdue-penalty
```

### 4. Manual Overdue Check
```bash
curl -X POST http://localhost:3001/api/check-overdue-books
```

## 🔧 Environment Requirements

### Required Environment Variables
```env
# Upstash QStash for workflow automation
QSTASH_TOKEN=your_qstash_token
QSTASH_URL=https://qstash.upstash.io

# Resend API for email delivery  
RESEND_TOKEN=your_resend_token

# Application URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### Development Mode
- **Missing Env Vars**: System logs email details instead of sending
- **Console Output**: Shows penalty calculations and email content
- **Safe Testing**: No actual emails sent without proper configuration

## 📈 Monitoring & Analytics

### Console Logging
```typescript
// Successful email
✅ Overdue penalty email sent to user@example.com for "Book Title" (3 days overdue, $1.50 penalty)

// Daily workflow summary  
📊 Daily overdue penalty workflow completed: {
  totalOverdue: 5,
  emailsSent: 4, 
  emailsFailed: 1,
  processedAt: "2025-12-16T09:00:00.000Z"
}
```

### API Response Format
```json
{
  "success": true,
  "message": "Daily overdue penalty workflow completed. Sent 4 emails.",
  "totalOverdue": 5,
  "emailsSent": 4,
  "emailsFailed": 1,
  "processedAt": "2025-12-16T09:00:00.000Z"
}
```

## 🚀 Benefits

### For Users
- **Clear Communication**: Immediate awareness of overdue status
- **Penalty Transparency**: Exact penalty amounts and daily accumulation
- **Easy Action**: One-click return button directs to profile page
- **Professional Experience**: Branded, responsive email design

### For Library Management  
- **Automated Enforcement**: Reduces manual follow-up work
- **Consistent Communication**: Standardized penalty notification process
- **Improved Returns**: Encourages timely book returns through clear penalties
- **Audit Trail**: Complete logging and tracking of all penalty notifications

### For System
- **Scalable Architecture**: Handles large user bases with background processing
- **Reliable Delivery**: Enterprise-grade email infrastructure
- **Efficient Processing**: Prevents duplicate notifications with database tracking
- **Easy Monitoring**: Comprehensive logging and error handling

## 📝 Integration with Existing Features

### Book Return Integration
- **Penalty Reset**: `overduePenaltySent` flag reset to `false` on book return
- **Return Confirmation**: Works alongside existing return confirmation emails
- **Status Updates**: Properly handles status changes during return process

### Due Date Reminders
- **Complementary System**: Works alongside due date reminder emails
- **Progressive Escalation**: Due date → Overdue penalty → Return confirmation
- **Separate Tracking**: Independent notification flags prevent conflicts

The Overdue Book Penalty system is now fully operational and provides a comprehensive, automated solution for managing overdue books and maintaining library accountability! 📚⚠️