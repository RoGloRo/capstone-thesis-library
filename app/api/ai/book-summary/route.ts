import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const { title, author, description } = await request.json();

    if (!title || !author || !description) {
      return NextResponse.json(
        { error: "title, author, and description are required" },
        { status: 400 }
      );
    }

    const prompt = `Summarize the following book in 2–3 sentences.\n\nTitle: ${title}\nAuthor: ${author}\nDescription: ${description}\n\nThe summary should be simple, informative, and suitable for students deciding whether to borrow the book.`;

    const chatResult = await callOpenRouterChat({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 200,
    });

    if (!chatResult.ok) {
      console.error("Groq book-summary error:", chatResult.error, chatResult.details);
      return NextResponse.json(
        { error: "I’m sorry, I couldn’t generate a summary right now. Please try again in a moment." },
        { status: chatResult.status ?? 502 }
      );
    }

    return NextResponse.json({ summary: chatResult.content });
  } catch (error) {
    console.error("book-summary route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
