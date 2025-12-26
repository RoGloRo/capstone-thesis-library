# Email Notification Workflows - Debugging & Fixes

## Issues Found and Fixed

### 1. **Wrong Endpoint Routing**
- **Problem**: Setup files were pointing to incorrect endpoints
- **Fixed**: Updated `setup-due-today-reminders` to point to `/api/workflows/daily-due-today-reminders` instead of `/api/check-books-due-today`

### 2. **Database Field References** 
- **Problem**: Workflows referenced non-existent fields like `overduePenaltySent`
- **Fixed**: Updated to use existing `reminderSent` field for tracking email status

### 3. **Inconsistent Workflow Architecture**
- **Problem**: Mixed usage of Upstash `serve()` vs standard POST handlers
- **Fixed**: Standardized all workflows to use NextJS POST handlers for consistency

### 4. **Date Logic & Timezone Issues**
- **Problem**: Inconsistent date format handling
- **Fixed**: Standardized to use `YYYY-MM-DD` format with proper timezone handling

### 5. **Missing Duplicate Prevention**
- **Problem**: No mechanism to prevent sending duplicate emails
- **Fixed**: Added `reminderSent` flag checks and updates

## Current Workflow Schedule

| Workflow | Time | Purpose | Endpoint |
|----------|------|---------|-----------|
| Due Date Reminders | 8:00 AM UTC | Books due tomorrow | `/api/check-due-date-reminders` |
| Due Today Reminders | 9:00 AM UTC | Books due today | `/api/workflows/daily-due-today-reminders` |
| Overdue Penalties | 9:00 AM UTC | Overdue books | `/api/workflows/daily-overdue-penalties` |

## Setup Instructions

### 1. **Environment Variables Required**
```bash
RESEND_TOKEN=your_resend_token
QSTASH_TOKEN=your_qstash_token
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 2. **Schedule All Workflows**
```bash
curl -X POST http://localhost:3001/api/setup-all-email-workflows
```

### 3. **Test All Workflows**  
```bash
curl -X POST http://localhost:3001/api/test-all-workflows
```

### 4. **Individual Setup (if needed)**
```bash
# Overdue penalties
curl -X POST http://localhost:3001/api/setup-overdue-penalties

# Due today reminders  
curl -X POST http://localhost:3001/api/setup-due-today-reminders -d '{"action":"schedule"}'

# Due date reminders
curl -X POST http://localhost:3001/api/setup-due-date-reminders -d '{"action":"schedule"}'
```

## Key Fixes Applied

### Database Query Improvements
- Added proper `isNull(returnDate)` checks
- Fixed status filtering (`BORROWED` vs `STATUS`)
- Added `reminderSent = false` filters to prevent duplicates

### Error Handling
- Added comprehensive environment variable checks
- Improved logging for debugging
- Added proper error responses

### Email Logic
- Standardized email template rendering
- Added proper date formatting
- Improved penalty calculation logic

## Testing & Monitoring

The workflows now include:
- ✅ Comprehensive logging for debugging
- ✅ Environment variable validation  
- ✅ Duplicate email prevention
- ✅ Proper error handling
- ✅ Manual testing endpoints

## Next Steps

1. Run the setup endpoint to schedule all workflows
2. Test manually using the test endpoint
3. Monitor logs for any issues
4. Check email delivery and database updates

## Troubleshooting

If emails aren't being sent:

1. **Check environment variables**: Ensure RESEND_TOKEN and QSTASH_TOKEN are set
2. **Verify schedules are active**: Check QStash dashboard
3. **Test manually**: Use `/api/test-all-workflows` endpoint
4. **Check logs**: Look for error messages in application logs
5. **Database verification**: Ensure books exist with proper due dates and status