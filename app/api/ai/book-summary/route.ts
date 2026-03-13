import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, author, description } = await request.json();

    if (!title || !author || !description) {
      return NextResponse.json(
        { error: "title, author, and description are required" },
        { status: 400 }
      );
    }

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const prompt = `Summarize the following book in 2–3 sentences.\n\nTitle: ${title}\nAuthor: ${author}\nDescription: ${description}\n\nThe summary should be simple, informative, and suitable for students deciding whether to borrow the book.`;

    const response = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub Models API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const summary: string =
      data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!summary) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("book-summary route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
