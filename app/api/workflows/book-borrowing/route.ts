import { serve } from "@upstash/workflow/nextjs";
import { sendEmail } from "@/lib/workflow";
import { render } from "@react-email/render";
import BookBorrowingConfirmationEmail from "@/emails/BookBorrowingConfirmationEmail";

type BookBorrowingData = {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  borrowDate: string;
  dueDate: string;
  loanDuration: number;
};

export const { POST } = serve<BookBorrowingData>(async (context) => {
  const { 
    userEmail, 
    userName, 
    bookTitle, 
    bookAuthor, 
    borrowDate, 
    dueDate, 
    loanDuration 
  } = context.requestPayload;

  // Send book borrowing confirmation email
  await context.run("send-borrowing-confirmation", async () => {
    // Render the React Email template to HTML
    const emailHtml = await render(
      BookBorrowingConfirmationEmail({
        userName,
        bookTitle,
        bookAuthor,
        borrowDate,
        dueDate,
        loanDuration,
      })
    );

    await sendEmail({
      email: userEmail,
      subject: `📚 Book Borrowed Successfully: ${bookTitle}`,
      message: emailHtml,
    });
  });
});