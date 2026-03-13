import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { and, desc, eq, inArray, ne, not } from "drizzle-orm";

interface CurrentBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback: existing genre-based similar books query (unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────

const getFallbackSimilarBooks = async (
  currentBookId: string,
  genre: string,
  excludeBookIds: string[] = [],
  limit = 5
): Promise<Book[]> => {
  const allExclude = [currentBookId, ...excludeBookIds];

  return db
    .select()
    .from(books)
    .where(
      and(
        eq(books.genre, genre),
        ne(books.id, currentBookId),
        allExclude.length > 1
          ? not(inArray(books.id, allExclude))
          : ne(books.id, currentBookId)
      )
    )
    .orderBy(desc(books.rating))
    .limit(limit) as unknown as Book[];
};

// ─────────────────────────────────────────────────────────────────────────────
// AI-enhanced: GPT-4o-mini semantic matching, falls back automatically
// ─────────────────────────────────────────────────────────────────────────────

export const getAiSimilarBooks = async (
  currentBook: CurrentBook,
  excludeBookIds: string[] = [],
  limit = 5
): Promise<Book[]> => {
  if (!process.env.GITHUB_TOKEN) {
    return getFallbackSimilarBooks(
      currentBook.id,
      currentBook.genre,
      excludeBookIds,
      limit
    );
  }

  try {
    // Fetch candidate books (exclude current + already-borrowed)
    const allExclude = [currentBook.id, ...excludeBookIds];

    const candidates = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
      })
      .from(books)
      .where(not(inArray(books.id, allExclude)))
      .orderBy(desc(books.rating))
      .limit(80);

    if (candidates.length === 0) {
      return getFallbackSimilarBooks(
        currentBook.id,
        currentBook.genre,
        excludeBookIds,
        limit
      );
    }

    const prompt = `You are a library book recommendation engine.

Selected Book:
Title: ${currentBook.title}
Author: ${currentBook.author}
Genre: ${currentBook.genre}
Description: ${currentBook.description}

Library Catalogue (id | title | author | genre):
${candidates.map((b) => `${b.id} | ${b.title} | ${b.author} | ${b.genre}`).join("\n")}

From the catalogue above, select the ${limit} books that are most similar in topic, subject, or concept to the selected book.
Return ONLY a JSON array of the matching book IDs, ordered by relevance.
Example: ["id1","id2","id3","id4","id5"]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
            temperature: 0.2,
            max_tokens: 150,
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResponse.ok) {
      console.warn("AI book-match API error, falling back to genre logic.");
      return getFallbackSimilarBooks(
        currentBook.id,
        currentBook.genre,
        excludeBookIds,
        limit
      );
    }

    const aiData = await aiResponse.json();
    const rawContent: string =
      aiData.choices?.[0]?.message?.content?.trim() ?? "";

    let recommendedIds: string[] = [];
    try {
      const cleaned = rawContent.replace(/```(?:json)?|```/g, "").trim();
      recommendedIds = JSON.parse(cleaned);
      if (!Array.isArray(recommendedIds)) throw new Error("Not an array");
    } catch {
      console.warn("Failed to parse AI book-match response, falling back.");
      return getFallbackSimilarBooks(
        currentBook.id,
        currentBook.genre,
        excludeBookIds,
        limit
      );
    }

    const validIds = recommendedIds.filter((id) =>
      candidates.some((b) => b.id === id)
    );

    if (validIds.length === 0) {
      return getFallbackSimilarBooks(
        currentBook.id,
        currentBook.genre,
        excludeBookIds,
        limit
      );
    }

    const matchedBooks = (await db
      .select()
      .from(books)
      .where(inArray(books.id, validIds))) as unknown as Book[];

    // Preserve AI ordering
    const ordered = validIds
      .map((id) => matchedBooks.find((b) => b.id === id))
      .filter((b): b is Book => b !== undefined);

    // Supplement to reach requested limit if AI returned fewer
    if (ordered.length < limit) {
      const fallback = await getFallbackSimilarBooks(
        currentBook.id,
        currentBook.genre,
        [...excludeBookIds, ...ordered.map((b) => b.id)],
        limit - ordered.length
      );
      return [...ordered, ...fallback];
    }

    return ordered;
  } catch (error) {
    console.error("AI book-match failed, using fallback:", error);
    return getFallbackSimilarBooks(
      currentBook.id,
      currentBook.genre,
      excludeBookIds,
      limit
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper used by the API route: also fetches user's borrowed book IDs
// ─────────────────────────────────────────────────────────────────────────────

export const getBorrowedBookIds = async (userId: string): Promise<string[]> => {
  const rows = await db
    .select({ bookId: borrowRecords.bookId })
    .from(borrowRecords)
    .where(eq(borrowRecords.userId, userId));
  return rows.map((r) => r.bookId);
};
