/**
 * Demo Email Logs Seeder
 * This file creates sample email logs for testing the admin email logs page
 * Run this manually when you want to populate the database with test data
 */

import { db } from "@/database/drizzle";
import { emailLogs, EMAIL_TYPE_ENUM, EMAIL_STATUS_ENUM } from "@/database/schema";

const sampleEmailLogs = [
  {
    recipientEmail: "john.doe@example.com",
    recipientName: "John Doe",
    emailType: "WELCOME" as const,
    status: "SENT" as const,
    subject: "Welcome to Smart Library! 👋 Your reading journey begins now",
    errorMessage: null,
    metadata: JSON.stringify({ userType: "new_user" }),
  },
  {
    recipientEmail: "jane.smith@example.com", 
    recipientName: "Jane Smith",
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
    recipientEmail: "bob.wilson@example.com",
    recipientName: "Bob Wilson", 
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
    recipientEmail: "alice.brown@example.com",
    recipientName: "Alice Brown",
    emailType: "OVERDUE_NOTICE" as const,
    status: "SENT" as const,
    subject: "⚠️ OVERDUE: 1984 - Immediate Return Required",
    errorMessage: null,
    metadata: JSON.stringify({ 
      bookTitle: "1984",
      daysOverdue: 3,
      noticeDate: new Date().toISOString()
    }),
  },
  {
    recipientEmail: "mike.johnson@example.com",
    recipientName: "Mike Johnson",
    emailType: "RETURN_CONFIRMATION" as const,
    status: "SENT" as const,
    subject: "📚 Book Returned Successfully: Pride and Prejudice",
    errorMessage: null,
    metadata: JSON.stringify({ 
      bookTitle: "Pride and Prejudice",
      returnDate: new Date().toISOString()
    }),
  },
  {
    recipientEmail: "sarah.davis@example.com",
    recipientName: "Sarah Davis",
    emailType: "ACCOUNT_APPROVAL" as const,
    status: "SENT" as const,
    subject: "🎉 Your Smart Library account has been approved!",
    errorMessage: null,
    metadata: JSON.stringify({ approvalDate: new Date().toISOString() }),
  },
  {
    recipientEmail: "error.user@example.com",
    recipientName: "Error User",
    emailType: "DUE_TODAY" as const,
    status: "FAILED" as const,
    subject: "🚨 URGENT: \"The Catcher in the Rye\" is due TODAY!",
    errorMessage: "SMTP connection failed: Invalid recipient email address",
    metadata: JSON.stringify({ 
      bookTitle: "The Catcher in the Rye",
      urgencyLevel: "high"
    }),
  },
  {
    recipientEmail: "test.user@example.com",
    recipientName: "Test User",
    emailType: "USER_ACTIVE" as const,
    status: "FAILED" as const,
    subject: "You're back and on fire! 🔥 Keep your reading momentum going",
    errorMessage: "Rate limit exceeded: 429 Too Many Requests",
    metadata: JSON.stringify({ streakDays: 7 }),
  },
];

export async function seedEmailLogs() {
  try {
    console.log("🌱 Seeding sample email logs...");
    
    // Insert sample email logs
    const result = await db.insert(emailLogs).values(sampleEmailLogs).returning({ id: emailLogs.id });
    
    console.log(`✅ Successfully seeded ${result.length} email logs`);
    console.log("📧 Sample email logs created:");
    
    sampleEmailLogs.forEach((log, index) => {
      const statusEmoji = log.status === "SENT" ? "✅" : "❌";
      console.log(`   ${statusEmoji} ${log.emailType} to ${log.recipientEmail}`);
    });
    
    return result;
  } catch (error) {
    console.error("❌ Error seeding email logs:", error);
    throw error;
  }
}

// If this file is run directly, execute the seeding
if (require.main === module) {
  seedEmailLogs()
    .then(() => {
      console.log("🎉 Email logs seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Email logs seeding failed:", error);
      process.exit(1);
    });
}