import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books, users, borrowRecords, savedBooks } from "@/database/schema";
import { and, count, desc, eq, sql, not } from "drizzle-orm";
import { subDays, startOfDay } from "date-fns";

export async function GET() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "AI API not configured" },
        { status: 503 }
      );
    }

    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const sixtyDaysAgo = startOfDay(subDays(new Date(), 60));

    // Gather all data in parallel
    const [
      totalBooksResult,
      totalUsersResult,
      totalBorrowsResult,
      overdueResult,
      topBorrowedBooks,
      topGenres,
      inactiveUsersResult,
      recentBorrowsResult,
      topSavedBooks,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(books),

      db.select({ count: sql<number>`count(*)` }).from(users),

      db.select({ count: sql<number>`count(*)` }).from(borrowRecords),

      // Overdue: currently borrowed and past due date
      db
        .select({ count: sql<number>`count(*)` })
        .from(borrowRecords)
        .where(
          sql`${borrowRecords.status} = 'BORROWED'::borrow_status AND ${borrowRecords.dueDate} <= CURRENT_DATE`
        ),

      // Top 5 most borrowed books (all time)
      db
        .select({
          title: books.title,
          genre: books.genre,
          borrowCount: count(borrowRecords.id),
        })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .groupBy(books.id, books.title, books.genre)
        .orderBy(desc(count(borrowRecords.id)))
        .limit(5),

      // Top genres by borrow frequency
      db
        .select({
          genre: books.genre,
          borrowCount: count(borrowRecords.id),
        })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .groupBy(books.genre)
        .orderBy(desc(count(borrowRecords.id)))
        .limit(5),

      // Inactive users: registered but no borrow activity in last 60 days
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          sql`${users.id} NOT IN (
            SELECT DISTINCT ${borrowRecords.userId}
            FROM ${borrowRecords}
            WHERE ${borrowRecords.borrowDate} >= ${sixtyDaysAgo.toISOString()}
          )`
        ),

      // Borrow count in last 30 days
      db
        .select({ count: sql<number>`count(*)` })
        .from(borrowRecords)
        .where(
          and(
            sql`${borrowRecords.borrowDate} >= ${thirtyDaysAgo.toISOString()}`
          )
        ),

      // Top saved books
      db
        .select({
          title: books.title,
          savedCount: count(savedBooks.id),
        })
        .from(savedBooks)
        .innerJoin(books, eq(savedBooks.bookId, books.id))
        .groupBy(books.id, books.title)
        .orderBy(desc(count(savedBooks.id)))
        .limit(3),
    ]);

    const totalBooks = Number(totalBooksResult[0]?.count ?? 0);
    const totalUsers = Number(totalUsersResult[0]?.count ?? 0);
    const totalBorrows = Number(totalBorrowsResult[0]?.count ?? 0);
    const overdueCount = Number(overdueResult[0]?.count ?? 0);
    const inactiveUsers = Number(inactiveUsersResult[0]?.count ?? 0);
    const recentBorrows = Number(recentBorrowsResult[0]?.count ?? 0);

    const topBooksList = topBorrowedBooks
      .map((b) => `${b.title} (${b.genre}, borrowed ${b.borrowCount}x)`)
      .join(", ");

    const topGenresList = topGenres
      .map((g) => `${g.genre} (${g.borrowCount} borrows)`)
      .join(", ");

    const topSavedList = topSavedBooks
      .map((b) => `${b.title} (saved ${b.savedCount}x)`)
      .join(", ");

    const prompt = `You are analyzing library usage data for a school library management system.

Library Data:
- Total books in catalogue: ${totalBooks}
- Total registered users: ${totalUsers}
- Total borrow records (all time): ${totalBorrows}
- Borrows in last 30 days: ${recentBorrows}
- Currently overdue books: ${overdueCount}
- Users inactive for 60+ days: ${inactiveUsers}
- Top borrowed books: ${topBooksList || "N/A"}
- Top genres by borrows: ${topGenresList || "N/A"}
- Most saved/wishlisted books: ${topSavedList || "N/A"}

Generate exactly 5 useful, short, and actionable insights that a school librarian would find helpful for managing the library.
Each insight should start with a relevant emoji, then a space, then the insight text.
Focus on trends, risks, recommendations, and observations.
Return the insights as a JSON array of strings.
Example format: ["📊 Insight one here.", "📈 Insight two here."]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let aiResponse: Response;
    try {
      aiResponse = await fetch(
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
            temperature: 0.5,
            max_tokens: 600,
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI library-insights API error:", errText);
      return NextResponse.json(
        { error: "AI service returned an error" },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent: string =
      aiData.choices?.[0]?.message?.content?.trim() ?? "";

    let insights: string[] = [];
    try {
      const cleaned = rawContent.replace(/```(?:json)?|```/g, "").trim();
      insights = JSON.parse(cleaned);
      if (!Array.isArray(insights)) throw new Error("Not an array");
      insights = insights.filter((i) => typeof i === "string");
    } catch {
      // If parsing fails, split on newlines as a gentle fallback
      insights = rawContent
        .split("\n")
        .map((l) => l.replace(/^[\d\-\*\.]+\s*/, "").trim())
        .filter((l) => l.length > 10)
        .slice(0, 6);
    }

    return NextResponse.json({
      insights,
      meta: {
        totalBooks,
        totalUsers,
        totalBorrows,
        recentBorrows,
        overdueCount,
        inactiveUsers,
      },
    });
  } catch (error) {
    console.error("GET /api/ai/library-insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
