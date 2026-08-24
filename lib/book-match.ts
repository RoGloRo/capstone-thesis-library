import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { getCacheJson, setCacheJson, type AiCacheValue } from "@/lib/ai-cache";
import { callOpenRouterChat } from "@/lib/openrouter";
import { getPopularBooks } from "@/lib/recommendations";
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
// Deterministic (non-AI) similar-books recommendations
//
// Used by the book-details page so opening a book never triggers an AI/API
// request. Tiered fallback built entirely from existing DB fields:
//   1. same genre/category (excludes the current book + borrowed books)
//   2. same author (any genre) when there aren't enough same-genre books
//   3. existing popular/available books via the app's getPopularBooks logic
// ─────────────────────────────────────────────────────────────────────────────

export const getSimilarBooks = async (
  currentBook: Pick<CurrentBook, "id" | "author" | "genre">,
  excludeBookIds: string[] = [],
  limit = 5
): Promise<Book[]> => {
  const allExclude = [currentBook.id, ...excludeBookIds];

  // Tier 1: same genre, highest-rated first, current + borrowed excluded
  const sameGenre = (await db
    .select()
    .from(books)
    .where(
      and(
        eq(books.genre, currentBook.genre),
        ne(books.id, currentBook.id),
        not(inArray(books.id, allExclude))
      )
    )
    .orderBy(desc(books.rating))
    .limit(limit)) as unknown as Book[];

  if (sameGenre.length >= limit) return sameGenre.slice(0, limit);

  // Tier 2: same author (any genre), excluding everything picked so far
  const sameAuthor = (await db
    .select()
    .from(books)
    .where(
      and(
        eq(books.author, currentBook.author),
        ne(books.id, currentBook.id),
        not(inArray(books.id, [...allExclude, ...sameGenre.map((b) => b.id)]))
      )
    )
    .orderBy(desc(books.rating))
    .limit(limit - sameGenre.length)) as unknown as Book[];

  const collected = [...sameGenre, ...sameAuthor];

  if (collected.length >= limit) return collected.slice(0, limit);

  // Tier 3: existing popular/available books (borrow-count + rating based)
  const popular = await getPopularBooks(
    [...allExclude, ...collected.map((b) => b.id)],
    limit - collected.length
  );

  return [...collected, ...popular].slice(0, limit);
};

// ─────────────────────────────────────────────────────────────────────────────
// Book Match result cache
//
// Shared across users (NOT per-user). The ranking is based on the current
// book's metadata (title/author/genre) + the catalog candidate pool, so it is
// identical for all viewers. The caller's borrowed books (excludeBookIds) are
// handled at read time by filtering them out of the cached ranking.
// Cached value is the AI-ranked book ID list (AiCacheValue) only; fresh Book
// records are always re-queried from Neon on a hit.
// ─────────────────────────────────────────────────────────────────────────────

const BOOK_MATCH_CACHE_TTL_SECONDS = 1800; // 30 minutes

const buildBookMatchCacheKey = (currentBookId: string, limit: number): string =>
  `ai:book-match:${limit}:${currentBookId}`;

const isValidCacheValue = (
  value: AiCacheValue | null | undefined
): value is AiCacheValue => {
  return (
    !!value &&
    Array.isArray(value.ids) &&
    value.ids.length > 0 &&
    value.ids.every((id) => typeof id === "string")
  );
};

/**
 * Rehydrates cached AI-ranked IDs into fresh, current Book[] records.
 * - Filters out the current book and the caller's borrowed/excluded book IDs.
 * - Re-queries Neon WITHOUT any availability filter (Book Match intentionally
 *   shows similar books regardless of availability — this must be preserved).
 * - Ignores IDs that no longer exist (they are dropped during hydration).
 * - Preserves the cached AI ranking/order.
 * - Fills any shortfall with the existing genre-based fallback (NO Groq call).
 */
const hydrateBookMatchFromCache = async (
  currentBookId: string,
  currentBookGenre: string,
  cachedIds: string[],
  excludeBookIds: string[],
  limit: number
): Promise<Book[]> => {
  const remainingIds = cachedIds.filter(
    (id) => id !== currentBookId && !excludeBookIds.includes(id)
  );

  if (remainingIds.length === 0) {
    return getFallbackSimilarBooks(
      currentBookId,
      currentBookGenre,
      excludeBookIds,
      limit
    );
  }

  const rows = (await db
    .select()
    .from(books)
    .where(inArray(books.id, remainingIds))) as unknown as Book[];

  const rowsById = new Map(rows.map((b) => [b.id, b]));

  // Preserve the cached AI ranking/order.
  const ordered = remainingIds
    .map((id) => rowsById.get(id))
    .filter((b): b is Book => b !== undefined);

  if (ordered.length >= limit) {
    return ordered.slice(0, limit);
  }

  const fallback = await getFallbackSimilarBooks(
    currentBookId,
    currentBookGenre,
    [...excludeBookIds, ...remainingIds],
    limit - ordered.length
  );
  return [...ordered, ...fallback].slice(0, limit);
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

  // ── Cache lookup (best-effort; miss/Redis failure → normal AI flow) ──
  const cacheKey = buildBookMatchCacheKey(currentBook.id, limit);
  const cached = await getCacheJson<AiCacheValue>(cacheKey);

  if (isValidCacheValue(cached)) {
    try {
      return await hydrateBookMatchFromCache(
        currentBook.id,
        currentBook.genre,
        cached.ids,
        excludeBookIds,
        limit
      );
    } catch (error) {
      console.warn("Book-match cache hydration failed, running AI flow:", error);
    }
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
      return fallbackResult();
    }

    if (!process.env.GROQ_API_KEY?.trim() || !process.env.GROQ_MODEL?.trim()) {
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

    // Best-effort cache write of the AI-ranked IDs (only after genuine AI
    // success). Never caches fallback-only or fallback-supplement results. A
    // cache failure must never break the book-match result path.
    await setCacheJson(
      cacheKey,
      { ids: validIds.slice(0, limit), generatedAt: new Date().toISOString() },
      BOOK_MATCH_CACHE_TTL_SECONDS
    );

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
