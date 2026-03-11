"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords, users, savedBooks } from "@/database/schema";
import dayjs from "dayjs";
import { and, eq, inArray } from "drizzle-orm";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;
  const borrowDays = Math.min(30, Math.max(1, params.borrowDays ?? 7));

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
    const dueDate = dayjs().add(borrowDays, "day").toDate();
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
          const { sendBorrowConfirmationEmail } = await import("@/lib/email-with-logging");
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
              loanDuration: borrowDays,
            })
          );

          await sendBorrowConfirmationEmail(
            user.email,
            user.fullName,
            emailHtml,
            bookDetails.title,
            bookDetails.author
          );
          
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
          const { sendReturnConfirmationEmail } = await import("@/lib/email-with-logging");
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

          await sendReturnConfirmationEmail(
            user.email,
            user.fullName,
            emailHtml,
            bookDetails.title
          );
          
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

// ─── Saved Books ────────────────────────────────────────────────────────────

export const toggleSaveBook = async (params: { userId: string; bookId: string }) => {
  const { userId, bookId } = params;

  try {
    const [existing] = await db
      .select({ id: savedBooks.id })
      .from(savedBooks)
      .where(and(eq(savedBooks.userId, userId), eq(savedBooks.bookId, bookId)))
      .limit(1);

    if (existing) {
      await db.delete(savedBooks).where(eq(savedBooks.id, existing.id));
      return { success: true, saved: false };
    }

    await db.insert(savedBooks).values({ userId, bookId });
    return { success: true, saved: true };
  } catch (error) {
    console.error("Error toggling saved book:", error);
    return { success: false, error: "Failed to update saved status" };
  }
};

export const getUserSavedBookIds = async (userId: string): Promise<string[]> => {
  try {
    const rows = await db
      .select({ bookId: savedBooks.bookId })
      .from(savedBooks)
      .where(eq(savedBooks.userId, userId));
    return rows.map((r) => r.bookId);
  } catch {
    return [];
  }
};

export const getUserSavedBooks = async (userId: string): Promise<Book[]> => {
  try {
    const savedIds = await getUserSavedBookIds(userId);
    if (savedIds.length === 0) return [];

    const rows = await db
      .select()
      .from(books)
      .where(inArray(books.id, savedIds));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      genre: r.genre,
      rating: r.rating,
      totalCopies: r.totalCopies,
      availableCopies: r.availableCopies,
      description: r.description,
      coverUrl: r.coverUrl,
      coverColor: r.coverColor,
      videoUrl: r.videoUrl,
      summary: r.summary,
      controlNumber: r.controlNumber ?? null,
      isLoanedBook: false,
    }));
  } catch {
    return [];
  }
};
