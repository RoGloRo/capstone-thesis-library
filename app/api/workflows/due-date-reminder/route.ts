import { serve } from "@upstash/workflow/nextjs";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import DueDateReminderEmail from "@/emails/DueDateReminderEmail";

type DueDateReminderData = {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: string;
  borrowRecordId: string;
  profileUrl: string;
};

export const { POST } = serve<DueDateReminderData>(async (context) => {
  const { 
    userEmail, 
    userName, 
    bookTitle, 
    bookAuthor, 
    dueDate, 
    borrowRecordId,
    profileUrl 
  } = context.requestPayload;

  // Send due date reminder email
  await context.run("send-due-date-reminder", async () => {
    // Render the React Email template to HTML
    const emailHtml = await render(
      DueDateReminderEmail({
        userName,
        bookTitle,
        bookAuthor,
        dueDate,
        profileUrl,
      })
    );

    await sendEmail({
      email: userEmail,
      subject: `⏰ Reminder: "${bookTitle}" is due tomorrow!`,
      message: emailHtml,
    });

    // Note: In a production environment, you would also update the database here
    // to mark that the reminder has been sent for this borrow record
    console.log(`Due date reminder sent for borrow record: ${borrowRecordId}`);
  });
});