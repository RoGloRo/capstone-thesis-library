import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { callOpenRouterChat } from "@/lib/openrouter";
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
// AI-enhanced semantic matching, falls back automatically
// ─────────────────────────────────────────────────────────────────────────────

export const getAiSimilarBooks = async (
  currentBook: CurrentBook,
  excludeBookIds: string[] = [],
  limit = 5
): Promise<Book[]> => {
  const fallbackResult = () =>
    getFallbackSimilarBooks(
      currentBook.id,
      currentBook.genre,
      excludeBookIds,
      limit
    );

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
      return fallbackResult();
    }

    if (!process.env.OPENROUTER_API_KEY?.trim() || !process.env.OPENROUTER_MODEL?.trim()) {
      return fallbackResult();
    }

    const prompt = `Find the ${limit} books most similar to: ${currentBook.title} by ${currentBook.author} (${currentBook.genre}). Return ONLY a JSON array of matching book IDs.\n${candidates
      .slice(0, 20)
      .map((b) => `${b.id} | ${b.title} | ${b.author} | ${b.genre}`)
      .join("\n")}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    let aiResult;
    try {
      aiResult = await callOpenRouterChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        maxTokens: 150,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResult.ok) {
      return fallbackResult();
    }

    const rawContent: string = aiResult.content;

    let recommendedIds: string[] = [];
    try {
      const cleaned = rawContent.replace(/```(?:json)?|```/g, "").trim();
      recommendedIds = JSON.parse(cleaned);
      if (!Array.isArray(recommendedIds)) throw new Error("Not an array");
    } catch {
      return fallbackResult();
    }

    const validIds = recommendedIds.filter((id) =>
      candidates.some((b) => b.id === id)
    );

    if (validIds.length === 0) {
      return fallbackResult();
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
    return fallbackResult();
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
