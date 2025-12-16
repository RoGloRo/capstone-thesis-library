"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords, users } from "@/database/schema";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;

  try {
    // Check if user already has an active borrowing record for this book
    const existingBorrowing = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, userId),
          eq(borrowRecords.bookId, bookId),
          eq(borrowRecords.status, "BORROWED" as const)
        )
      )
      .limit(1);

    if (existingBorrowing.length > 0) {
      return {
        success: false,
        error: "You already have an active borrowing for this book",
      };
    }

    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        error: "Book is not available for borrowing. Out of copies",
      };
    }

    const borrowDate = dayjs().toDate();
    const dueDate = dayjs().add(7, "day").toDate();
    const dueDateString = dueDate.toDateString();

    const [record] = await db.insert(borrowRecords).values({
      userId,
      bookId,
      dueDate: dueDateString,
      status: "BORROWED",
    }).returning();

    await db
      .update(books)
      .set({ availableCopies: book[0].availableCopies - 1 })
      .where(eq(books.id, bookId));

    // Fetch user and book details for email notification
    const [user] = await db
      .select({
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [bookDetails] = await db
      .select({
        title: books.title,
        author: books.author,
      })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (user && bookDetails) {
      // Check if we have the necessary environment variables for email
      const hasResendToken = !!process.env.RESEND_TOKEN;
      const hasQstashToken = !!process.env.QSTASH_TOKEN;
      
      if (hasResendToken && hasQstashToken) {
        // Send email directly using sendEmail function instead of workflow for development
        try {
          const { sendEmail } = await import("@/lib/workflow");
          const { render } = await import("@react-email/render");
          const BookBorrowingConfirmationEmail = (await import("@/emails/BookBorrowingConfirmationEmail")).default;
          
          const emailHtml = await render(
            BookBorrowingConfirmationEmail({
              userName: user.fullName,
              bookTitle: bookDetails.title,
              bookAuthor: bookDetails.author,
              borrowDate: borrowDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              dueDate: dueDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              loanDuration: 7,
            })
          );

          await sendEmail({
            email: user.email,
            subject: `📚 Book Borrowed Successfully: ${bookDetails.title}`,
            message: emailHtml,
          });
          
          console.log("✅ Email sent successfully to:", user.email);
        } catch (emailError) {
          // Log the error but don't fail the borrowing process
          console.error("Failed to send email notification:", emailError);
        }
      } else {
        // Missing environment variables, log what would be sent
        console.log("📧 Email notification (missing env vars):", {
          to: user.email,
          subject: `📚 Book Borrowed Successfully: ${bookDetails.title}`,
          bookTitle: bookDetails.title,
          bookAuthor: bookDetails.author,
          userName: user.fullName,
          borrowDate: borrowDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          dueDate: dueDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          missing: {
            resendToken: !hasResendToken,
            qstashToken: !hasQstashToken,
          },
        });
      }
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      error: "An error occurred while borrowing the book",
    };
  }
};

export const returnBook = async (params: { borrowRecordId: string; bookId: string }) => {
  const { borrowRecordId, bookId } = params;

  try {
    // First get the current available copies
    const [book] = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      throw new Error('Book not found');
    }

    // Update the borrow record
    const [record] = await db
      .update(borrowRecords)
      .set({
        status: 'STATUS', // Using 'STATUS' as the return status (matches current database)
        returnDate: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      })
      .where(eq(borrowRecords.id, borrowRecordId))
      .returning();

    if (!record) {
      throw new Error('Borrow record not found');
    }

    // Update the book's available copies
    await db
      .update(books)
      .set({ 
        availableCopies: book.availableCopies + 1 
      })
      .where(eq(books.id, bookId));

    // Fetch user and book details for return confirmation email
    const [user] = await db
      .select({
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, record.userId))
      .limit(1);

    const [bookDetails] = await db
      .select({
        title: books.title,
        author: books.author,
      })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    // Send return confirmation email
    if (user && bookDetails) {
      // Check if we have the necessary environment variables for email
      const hasResendToken = !!process.env.RESEND_TOKEN;
      const hasQstashToken = !!process.env.QSTASH_TOKEN;
      
      if (hasResendToken && hasQstashToken) {
        try {
          const { sendEmail } = await import("@/lib/workflow");
          const { render } = await import("@react-email/render");
          const BookReturnConfirmationEmail = (await import("@/emails/BookReturnConfirmationEmail")).default;
          
          // Calculate loan duration if we have borrow date
          const borrowDate = new Date(record.borrowDate);
          const returnDate = new Date();
          const loanDuration = Math.ceil((returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
          
          const emailHtml = await render(
            BookReturnConfirmationEmail({
              userName: user.fullName,
              bookTitle: bookDetails.title,
              bookAuthor: bookDetails.author,
              returnDate: returnDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              borrowDate: borrowDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              loanDuration,
              libraryUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/library`,
            })
          );

          await sendEmail({
            email: user.email,
            subject: `📚 Book Returned Successfully: ${bookDetails.title}`,
            message: emailHtml,
          });
          
          console.log("✅ Return confirmation email sent successfully to:", user.email);
        } catch (emailError) {
          // Log the error but don't fail the return process
          console.error("Failed to send return confirmation email:", emailError);
        }
      } else {
        // Missing environment variables, log what would be sent
        console.log("📧 Return confirmation email (missing env vars):", {
          to: user.email,
          subject: `📚 Book Returned Successfully: ${bookDetails.title}`,
          bookTitle: bookDetails.title,
          bookAuthor: bookDetails.author,
          userName: user.fullName,
          returnDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          missing: {
            resendToken: !hasResendToken,
            qstashToken: !hasQstashToken,
          },
        });
      }
    }

    return { success: true, data: record };
  } catch (error) {
    console.error('Error returning book:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to return book'
    };
  }
};
