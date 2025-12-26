# Email Templates

This directory contains React Email templates for the Smart Library application.

## Templates

### AccountRejectionEmail

A professional email template for account registration rejections that includes:

- Clear notification of rejection status
- User's name and personalized message
- Supportive tone explaining the decision
- Next steps and guidance for users
- Support contact information
- Professional red-themed styling
- Encouragement to reapply if eligible

### BookBorrowingConfirmationEmail

A reusable email template for book borrowing confirmations that includes:

- User's name and personalized greeting
- Book title and author information
- Loan details (borrow date, due date, duration)
- Important reminders about return dates
- Call-to-action button to view profile
- Professional styling with consistent branding

### DueDateReminderEmail

An urgent-styled email template for due date reminders featuring:

- Red color scheme to indicate urgency
- Book details and due date prominently displayed
- Clear call-to-action button
- Return options and instructions
- Professional urgent layout

### WelcomeEmail

A welcoming email template for new user onboarding with:

- Green color scheme for positive welcome
- Feature highlights and getting started tips
- Welcome back incentives
- Professional onboarding layout

### UserInactiveEmail

A "we miss you" email template for inactive users featuring:

- Purple color scheme for gentle encouragement
- New features since last visit
- Special welcome back offers
- Incentives to return

### UserActiveEmail

A celebration email template for returning active users with:

- Orange/fire color scheme for energy
- Achievement stats and reading streaks
- Motivational content and quotes
- Encouragement to maintain momentum

### AccountApprovalEmail

An approval notification email template for newly approved users featuring:

- Green color scheme for success and approval
- Account activation confirmation
- Feature highlights and quick start guide
- Account details and access information
- Professional approval layout with call-to-action

## Usage

The templates are automatically used by the workflow system when triggering email notifications. They are rendered to HTML using `@react-email/render` before being sent through the Upstash QStash + Resend integration.

## Development

To preview email templates during development:

1. Install React Email CLI: `npm install -g @react-email/cli`
2. Run: `email dev` (from project root)
3. Open browser to view and test templates

## Testing

Email notifications are triggered automatically when users borrow books. The system:

1. Creates a borrow record in the database
2. Fetches user and book details
3. Triggers the workflow endpoint asynchronously
4. Renders the email template with real data
5. Sends the email through Resend