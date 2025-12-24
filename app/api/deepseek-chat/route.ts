import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_DEEPSEEK_API_KEY) {
      console.error("OpenRouter API key not found");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    // Call OpenRouter API with DeepSeek model
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3000",
        "X-Title": "Library Chat App",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to get response from AI service" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("No response content from OpenRouter:", data);
      return NextResponse.json(
        { error: "No response from AI service" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: "deepseek/deepseek-chat"
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