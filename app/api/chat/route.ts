import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books, users } from "@/database/schema";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GITHUB_TOKEN) {
      console.error("GitHub token not found");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    // Fetch current books and users data
    const booksData = await db.select().from(books);
    const usersData = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      status: users.status,
      role: users.role
    }).from(users);

    // Call GitHub Models API with GPT-4o-mini
    const messages = [
      {
        role: "system",
        content: `
          You are Smart Library AI, a helpful assistant for a school library management system.

          Use the provided library information when answering questions related to the app, library rules, or services.
          If the information is not provided, you may answer using general knowledge.
          Do NOT invent or guess app-specific details such as book availability, user data, or system behavior.
          If unsure about app-specific information, say you don't know or suggest contacting the library.
          Be polite, friendly, and clear.
          `
      },
      {
        role: "system",
        content: `
          Library FAQs (App-Specific Information):
          - The library is located at Muntinlupa National High School(MNHS) 92QH+J45, University Rd, Muntinlupa, 1776 Metro Manila.
          - The library is open from 8:00 AM to 4:00 PM, Monday to Friday.
          - The library app allows users to browse and search for books, borrow and return them, and view their borrowing history.
          - Users can borrow up to the maximum number of books allowed by library policy.
          - New accounts must be reviewed and approved by an administrator for security purposes.
          - Search for a book, open its details page, and click the Borrow button if the book is available.
          - Yes. You need an account to borrow books, view your borrowing history, and receive notifications.
          - Users can only borrow a book if they have an account and if they are approved by the admin.
          - Borrowing period is 7 days.
          - Overdue books incur a penalty.
          - Users can not yet save books to their profile.
          - No, users cannot yet update certain profile details from their profile page.
          - Admins approve user registrations.
          - To Return a Book,Go to My Borrowed Books, select the book you want to return, and click Return.
          - You may receive emails for:
            Book due today reminders
            Overdue notices
            Book return confirmations
            Receipt downloads
          - You can view your borrowed books and loan history in the My Profile Borrowed Books section.
          - No, you cannot renew borrowed books yet.
          - If someone asks about the specific information about the users, just say that you don't have access to that information.   That information is private and confidential.
          - The book may not be available or may already be borrowed.
          - The developers of this app/website are General Lemor Oquias, Paul Balisi, and Kenneth Sedava.
          - If you need further assistance, please contact the library directly:
          📧 contact@lemoroquias.online
          📞 09933703396
          `
      },
      {
        role: "system",
        content: `
          Current Book Data:
          Total Books: ${booksData.length}
          
          ${booksData
            .map(
              b =>
                `- Title: ${b.title}, Author: ${b.author}, Genre: ${b.genre}, Available Copies: ${b.availableCopies}/${b.totalCopies}, Rating: ${b.rating}/5`
            )
            .join("\n")}
          `
      },
      {
        role: "system",
        content: `
          Current User Data:
          Total Users: ${usersData.length}
          
          ${usersData
            .map(
              u =>
                `- Name: ${u.fullName}, Status: ${u.status || 'PENDING'}, Role: ${u.role || 'USER'}`
            )
            .join("\n")}
          `
      },
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("GitHub Models API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to get response from AI service" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("No response content from GitHub Models:", data);
      return NextResponse.json(
        { error: "No response from AI service" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: "gpt-4o-mini"
    });

  } catch (error) {
    console.error("GitHub Models chat API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}