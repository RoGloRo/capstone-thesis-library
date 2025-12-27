# Automated Email Notification System - Complete Guide

## 📧 Overview

The library has a consolidated automated email notification system that runs once daily to handle all email checks:

### **Consolidated Daily Email System**
- **Schedule**: Daily at 9:00 AM UTC
- **Endpoint**: `POST /api/workflows/consolidated-daily-emails`
- **Function**: Runs all three email checks in a single cron job:
  1. **Overdue Book Penalties** - Books with due date < today
  2. **Due Today Reminders** - Books with due date = today  
  3. **Due Date Reminders** - Books with due date = tomorrow (1 day before)

This consolidated approach uses only 1 Vercel cron job instead of 3, staying within free tier limits.

### Individual Email Types:

#### 1. **Overdue Book Penalties** 
- **Trigger**: Books with due date < today
- **Internal Endpoint**: `POST /api/workflows/daily-overdue-penalties`
- **Email**: Overdue penalty notification with fine calculation ($0.50/day)

#### 2. **Due Today Reminders**
- **Trigger**: Books with due date = today
- **Internal Endpoint**: `POST /api/workflows/daily-due-today-reminders`
- **Email**: Urgent reminder that book is due today

#### 3. **Due Date Reminders (1 Day Before)**
- **Trigger**: Books with due date = tomorrow
- **Internal Endpoint**: `POST /api/check-due-date-reminders`
- **Email**: Friendly reminder that book is due tomorrow

## ⚙️ Configuration

### Required Environment Variables

**Production (Vercel Dashboard):**
```bash
NEXT_PUBLIC_BASE_URL=https://capstone-thesis-library.vercel.app
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
RESEND_TOKEN=your_resend_token
```

**Local Development (.env.local):**
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
RESEND_TOKEN=your_resend_token
```

### Vercel Cron Configuration (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/workflows/consolidated-daily-emails",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Note**: This uses only 1 cron job (within Vercel free tier limit of 2) by consolidating all three email checks into a single endpoint.

## 🧪 Testing

### 1. Diagnostic Endpoint

**Check System Status:**
```bash
GET https://capstone-thesis-library.vercel.app/api/test-helpers/automated-emails-diagnostic
```

This returns:
- Environment configuration status
- Number of overdue books
- Number of books due today
- Number of books due tomorrow
- Detailed list of all books requiring emails
- Cron schedule information

### 2. Manual Trigger Endpoints

**Trigger Overdue Emails:**
```bash
POST https://capstone-thesis-library.vercel.app/api/test-helpers/automated-emails-diagnostic
Body: { "action": "overdue" }
```

**Trigger Due Today Emails:**
```bash
POST https://capstone-thesis-library.vercel.app/api/test-helpers/automated-emails-diagnostic
Body: { "action": "due-today" }
```

**Trigger Due Tomorrow Emails:**
```bash
POST https://capstone-thesis-library.vercel.app/api/test-helpers/automated-emails-diagnostic
Body: { "action": "due-tomorrow" }
```

## 🔍 How It Works

### Book Borrowing Flow

1. User borrows a book → Creates `borrowRecord` with:
   - `status`: "BORROWED"
   - `dueDate`: borrowDate + 7 days
   - `reminderSent`: false
   - `returnDate`: null

2. User receives immediate borrowing confirmation email

### Automated Email Flow

#### Daily Schedule (UTC):
- **9:00 AM**: Consolidated daily emails run (all three types in sequence)
  1. Overdue Penalties
  2. Due Today Reminders
  3. Due Date Reminders (1 day before)

#### Email Logic:

**Overdue Books:**
```sql
SELECT * FROM borrowRecords 
WHERE status = 'BORROWED' 
  AND dueDate < TODAY
  AND reminderSent = false
  AND returnDate IS NULL
```
- Calculates days overdue and penalty amount
- Sends overdue penalty email
- Sets `reminderSent = true` to prevent duplicate emails

**Due Today:**
```sql
SELECT * FROM borrowRecords 
WHERE status = 'BORROWED' 
  AND dueDate = TODAY
  AND returnDate IS NULL
```
- Sends urgent "due today" reminder
- Runs every day for books due today

**Due Tomorrow:**
```sql
SELECT * FROM borrowRecords 
WHERE status = 'BORROWED' 
  AND dueDate = TOMORROW
  AND reminderSent = false
```
- Sends friendly "due tomorrow" reminder
- Sets `reminderSent = true`

## 📊 Monitoring

### Vercel Function Logs

Monitor automated emails in Vercel Dashboard:
1. Go to your project → Deployments
2. Click on production deployment
3. Go to Functions tab
4. Check logs for:
   - `/api/workflows/consolidated-daily-emails` (main cron job)
   - Individual endpoints if manually triggered

### QStash Dashboard

Monitor email delivery:
1. Go to Upstash Console → QStash
2. Check Logs tab for email delivery status
3. Look for API calls to Resend

### Resend Dashboard

Monitor actual email delivery:
1. Go to Resend Dashboard
2. Check Emails tab for delivery status
3. View open rates and bounce rates

## ✅ Verification Checklist

### Local Testing:
- [ ] Environment variables set in `.env.local`
- [ ] Run diagnostic: `GET /api/test-helpers/automated-emails-diagnostic`
- [ ] Manually trigger each email type using POST endpoint
- [ ] Check console logs for email sending confirmation
- [ ] Verify email received in inbox

### Production Testing:
- [ ] Set `NEXT_PUBLIC_BASE_URL` in Vercel Dashboard
- [ ] Verify all environment variables in Vercel
- [ ] Deploy to Vercel
- [ ] Check Vercel Cron Jobs are enabled (should see 1 cron job)
- [ ] Run diagnostic: `GET https://your-domain.vercel.app/api/test-helpers/automated-emails-diagnostic`
- [ ] Manually trigger consolidated emails: `POST https://your-domain.vercel.app/api/workflows/consolidated-daily-emails`
- [ ] Check Vercel function logs
- [ ] Check QStash dashboard
- [ ] Check Resend dashboard
- [ ] Verify emails received

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check environment variables:**
   ```bash
   GET /api/test-helpers/automated-emails-diagnostic
   ```
   - Verify `hasResendToken` and `hasQStashToken` are both `true`

2. **Check cron is running:**
   - Go to Vercel Dashboard → Settings → Cron Jobs
   - Verify crons are enabled and scheduled correctly

3. **Check function logs:**
   - Look for error messages in Vercel function logs
   - Search for "❌" emoji in logs

4. **Verify email service:**
   - Check Resend dashboard for API errors
   - Verify sender domain is configured correctly

### Duplicate Emails

- Check `reminderSent` flag in database
- Verify cron jobs aren't running multiple times
- Check QStash dashboard for duplicate webhook calls

### Wrong Due Dates

- Verify system timezone settings
- Check date calculation in book borrowing flow
- Ensure dates are stored in YYYY-MM-DD format

## 📝 Database Schema

```typescript
borrowRecords {
  id: string
  userId: string
  bookId: string
  borrowDate: string
  dueDate: string        // YYYY-MM-DD format
  returnDate: string?    // null if not returned
  status: "BORROWED" | "RETURNED"
  reminderSent: boolean  // Tracks if overdue/due-date reminder sent
}
```

## 🚀 Deployment Steps

1. **Update environment variables in Vercel:**
   ```
   NEXT_PUBLIC_BASE_URL=https://capstone-thesis-library.vercel.app
   ```

2. **Deploy to Vercel:**
   ```bash
   git push
   ```

3. **Verify cron jobs:**
   - Go to Vercel Dashboard → Settings → Cron Jobs
   - Confirm 3 cron jobs are listed

4. **Test the system:**
   ```bash
   GET https://capstone-thesis-library.vercel.app/api/test-helpers/automated-emails-diagnostic
   ```

5. **Monitor for 24 hours:**
   - Check Vercel logs at scheduled times
   - Verify emails are being sent
   - Check user inbox for test emails

## 📞 Support

If issues persist:
1. Check all environment variables
2. Review Vercel function logs
3. Check QStash webhook logs
4. Verify Resend API status
5. Test with diagnostic endpoint