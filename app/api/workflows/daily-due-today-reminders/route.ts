import { serve } from "@upstash/workflow/nextjs";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";

export const { POST } = serve(async (context) => {
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  
  console.log(`🔍 Daily check: Books due today (${todayDateString})`);

  // Find all borrowed books that are due today
  const booksDueToday = await db
    .select({
      borrowRecordId: borrowRecords.id,
      userEmail: users.email,
      userName: users.fullName,
      bookTitle: books.title,
      bookAuthor: books.author,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
    })
    .from(borrowRecords)
    .innerJoin(users, eq(borrowRecords.userId, users.id))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.status, "BORROWED"),
        eq(borrowRecords.dueDate, todayDateString)
      )
    );

  console.log(`📚 Found ${booksDueToday.length} books due today`);

  if (booksDueToday.length === 0) {
    console.log("✅ No books due today - no reminders needed");
    return {
      success: true,
      message: "No books due today",
      processed: 0,
    };
  }

  let emailsSent = 0;
  let emailsFailed = 0;

  for (const record of booksDueToday) {
    try {
      console.log(`📧 Sending due today reminder to: ${record.userEmail} for "${record.bookTitle}"`);

      // Import email utilities
      const { sendEmail } = await import("@/lib/workflow");
      const { render } = await import("@react-email/render");
      const BookDueTodayEmail = (await import("@/emails/BookDueTodayEmail")).default;

      // Calculate loan duration
      const borrowDate = new Date(record.borrowDate);
      const dueDate = new Date(record.dueDate);
      const loanDuration = Math.ceil((dueDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));

      // Format dates for display
      const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Generate email HTML
      const emailHtml = await render(
        BookDueTodayEmail({
          userName: record.userName,
          bookTitle: record.bookTitle,
          bookAuthor: record.bookAuthor,
          borrowDate: formatDate(borrowDate),
          dueDate: formatDate(dueDate),
          loanDuration,
          profileUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-profile`,
        })
      );

      // Send email
      await sendEmail({
        email: record.userEmail,
        subject: `🚨 URGENT: "${record.bookTitle}" is due TODAY!`,
        message: emailHtml,
      });

      console.log(`✅ Due today email sent successfully to: ${record.userEmail}`);
      emailsSent++;

      // Add a small delay between emails to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to send due today email to ${record.userEmail}: ${error}`);
      emailsFailed++;
    }
  }

  const summary = `📊 Due today reminders complete: ${emailsSent} sent, ${emailsFailed} failed`;
  console.log(summary);

  return {
    success: true,
    message: summary,
    processed: booksDueToday.length,
    emailsSent,
    emailsFailed,
    date: todayDateString,
  };
});