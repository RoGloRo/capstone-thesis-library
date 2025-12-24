/**
 * Seed test notifications for demo purposes
 * This creates sample email logs that can be used to test the notification bell
 */

import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";

// Demo user email - replace with actual user email for testing
const DEMO_USER_EMAIL = "demo@example.com";

const testNotifications = [
  {
    recipientEmail: DEMO_USER_EMAIL,
    recipientName: "Demo User",
    emailType: "WELCOME" as const,
    status: "SENT" as const,
    subject: "🎉 Welcome to Smart Library! Your reading journey begins now",
    errorMessage: null,
    metadata: JSON.stringify({ userType: "new_user" }),
  },
  {
    recipientEmail: DEMO_USER_EMAIL,
    recipientName: "Demo User",
    emailType: "BORROW_CONFIRMATION" as const,
    status: "SENT" as const,
    subject: "📚 Book Borrowed: The Great Gatsby",
    errorMessage: null,
    metadata: JSON.stringify({ 
      bookTitle: "The Great Gatsby", 
      bookAuthor: "F. Scott Fitzgerald",
      borrowDate: new Date().toISOString() 
    }),
  },
  {
    recipientEmail: DEMO_USER_EMAIL,
    recipientName: "Demo User",
    emailType: "DUE_REMINDER" as const,
    status: "SENT" as const,
    subject: "⏰ Reminder: \"To Kill a Mockingbird\" is due tomorrow!",
    errorMessage: null,
    metadata: JSON.stringify({ 
      bookTitle: "To Kill a Mockingbird",
      reminderType: "one_day_before"
    }),
  },
  {
    recipientEmail: DEMO_USER_EMAIL,
    recipientName: "Demo User",
    emailType: "DUE_TODAY" as const,
    status: "SENT" as const,
    subject: "📅 Book Due Today: Pride and Prejudice",
    errorMessage: null,
    metadata: JSON.stringify({
      bookTitle: "Pride and Prejudice",
      bookAuthor: "Jane Austen",
      dueDate: new Date().toISOString().split('T')[0]
    }),
  },
  {
    recipientEmail: DEMO_USER_EMAIL,
    recipientName: "Demo User",
    emailType: "RETURN_CONFIRMATION" as const,
    status: "SENT" as const,
    subject: "✅ Book Returned: 1984 - Thank you!",
    errorMessage: null,
    metadata: JSON.stringify({
      bookTitle: "1984",
      bookAuthor: "George Orwell",
      returnDate: new Date().toISOString()
    }),
  }
];

async function seedTestNotifications() {
  console.log("Seeding test notifications...");

  try {
    // Clear existing notifications for demo user (optional)
    // await db.delete(emailLogs).where(eq(emailLogs.recipientEmail, DEMO_USER_EMAIL));
    
    // Insert test notifications with current timestamps
    for (const notification of testNotifications) {
      await db.insert(emailLogs).values({
        ...notification,
        sentAt: new Date(),
      });
    }

    console.log(`✅ Successfully seeded ${testNotifications.length} test notifications for ${DEMO_USER_EMAIL}`);
  } catch (error) {
    console.error("❌ Error seeding test notifications:", error);
  }
}

// Run the seeder
seedTestNotifications();