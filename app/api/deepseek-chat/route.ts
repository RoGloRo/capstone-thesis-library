import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const chatResult = await callOpenRouterChat({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for a library management system. Help users with questions about books, library services, and general inquiries."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    if (!chatResult.ok) {
      console.error("Groq API error:", chatResult.error, chatResult.details);
      return NextResponse.json(
        {
          success: false,
          error: "Sorry, I’m having trouble responding right now. Please try again in a moment.",
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
        },
        { status: chatResult.status ?? 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: chatResult.content,
      model: chatResult.model
    });

  } catch (error) {
    console.error("DeepSeek chat API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}