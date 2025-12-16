import { NextRequest, NextResponse } from "next/server";
import { workflowClient } from "@/lib/workflow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userEmail,
      userName,
      bookTitle,
      bookAuthor,
      returnDate,
      borrowDate,
      loanDuration
    } = body;

    // Validate required fields
    if (!userEmail || !userName || !bookTitle || !bookAuthor || !returnDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userEmail, userName, bookTitle, bookAuthor, returnDate are required",
        },
        { status: 400 }
      );
    }

    // Check if we have the necessary environment variables
    const hasResendToken = !!process.env.RESEND_TOKEN;
    const hasQstashToken = !!process.env.QSTASH_TOKEN;
    
    if (!hasResendToken || !hasQstashToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured. Missing RESEND_TOKEN or QSTASH_TOKEN environment variables.",
          missing: {
            resendToken: !hasResendToken,
            qstashToken: !hasQstashToken,
          },
        },
        { status: 500 }
      );
    }

    // Trigger the return confirmation email workflow
    const workflowRunId = await workflowClient.trigger({
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/workflows/book-return-confirmation`,
      body: {
        userEmail,
        userName,
        bookTitle,
        bookAuthor,
        returnDate,
        borrowDate,
        loanDuration,
      },
    });

    console.log(`✅ Return confirmation email workflow triggered with ID: ${workflowRunId}`);

    return NextResponse.json({
      success: true,
      message: "Return confirmation email sent successfully",
      workflowRunId,
      details: {
        userEmail,
        bookTitle,
        returnDate,
      },
    });

  } catch (error) {
    console.error("❌ Error sending return confirmation email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Book Return Confirmation Email Test Endpoint",
    usage: {
      method: "POST",
      requiredFields: [
        "userEmail",
        "userName", 
        "bookTitle",
        "bookAuthor",
        "returnDate"
      ],
      optionalFields: [
        "borrowDate",
        "loanDuration"
      ],
      example: {
        userEmail: "user@example.com",
        userName: "John Doe",
        bookTitle: "The Great Gatsby",
        bookAuthor: "F. Scott Fitzgerald",
        returnDate: "December 16, 2024",
        borrowDate: "December 1, 2024",
        loanDuration: 15
      }
    },
    description: "Test endpoint for triggering book return confirmation emails manually",
  });
}