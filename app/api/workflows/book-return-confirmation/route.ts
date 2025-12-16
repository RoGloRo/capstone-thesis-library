import { serve } from "@upstash/workflow/nextjs";

type BookReturnEmailData = {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  returnDate: string;
  borrowDate?: string;
  loanDuration?: number;
};

export const { POST } = serve(async (context) => {
  const { 
    userEmail, 
    userName, 
    bookTitle, 
    bookAuthor, 
    returnDate, 
    borrowDate, 
    loanDuration 
  } = context.requestPayload as BookReturnEmailData;

  await context.log(`📧 Sending return confirmation email to: ${userEmail} for "${bookTitle}"`);

  try {
    // Import email utilities
    const { sendEmail } = await import("@/lib/workflow");
    const { render } = await import("@react-email/render");
    const BookReturnConfirmationEmail = (await import("@/emails/BookReturnConfirmationEmail")).default;

    // Generate email HTML
    const emailHtml = await render(
      BookReturnConfirmationEmail({
        userName,
        bookTitle,
        bookAuthor,
        returnDate,
        borrowDate,
        loanDuration,
        libraryUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/library`,
      })
    );

    // Send email
    await sendEmail({
      email: userEmail,
      subject: `📚 Book Returned Successfully: ${bookTitle}`,
      message: emailHtml,
    });

    await context.log(`✅ Return confirmation email sent successfully to: ${userEmail}`);

    return {
      success: true,
      message: `Return confirmation email sent to ${userEmail}`,
      bookTitle,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    await context.log(`❌ Failed to send return confirmation email to ${userEmail}: ${error}`);
    
    throw new Error(`Failed to send return confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});