import { db } from "@/database/drizzle";
import { books, borrowRecords, savedBooks } from "@/database/schema";
import { getCacheJson, setCacheJson, type AiCacheValue } from "@/lib/ai-cache";
import { callOpenRouterChat } from "@/lib/openrouter";
import { and, count, desc, eq, gt, inArray, not, sql } from "drizzle-orm";
import { createHash } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Existing fallback: borrow-count + rating based popular books (unchanged)
// Re-exported so page.tsx can still import `getPopularBooks` from here if needed.
// ─────────────────────────────────────────────────────────────────────────────

export { getPopularBooks } from "@/lib/recommendations";

// ─────────────────────────────────────────────────────────────────────────────
// Data gathering helper shared by AI function and API route
// ─────────────────────────────────────────────────────────────────────────────

interface BookCandidate {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  totalCopies: number;
  availableCopies: number;
  videoUrl: string;
  summary: string;
  createdAt: Date | null;
  recentBorrows: number;
  savedCount: number;
}

export const getTrendingCandidates = async (
  excludeIds: string[] = [],
  limit = 30
): Promise<BookCandidate[]> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      description: books.description,
      rating: books.rating,
      coverUrl: books.coverUrl,
      coverColor: books.coverColor,
      totalCopies: books.totalCopies,
      availableCopies: books.availableCopies,
      videoUrl: books.videoUrl,
      summary: books.summary,
      createdAt: books.createdAt,
      recentBorrows: count(borrowRecords.id),
    })
    .from(books)
    .leftJoin(
      borrowRecords,
      and(
        eq(borrowRecords.bookId, books.id),
        sql`${borrowRecords.borrowDate} >= ${sevenDaysAgo.toISOString()}`
      )
    )
    .where(
      excludeIds.length > 0
        ? and(gt(books.availableCopies, 0), not(inArray(books.id, excludeIds)))
        : gt(books.availableCopies, 0)
    )
    .groupBy(books.id)
    .orderBy(desc(sql`COUNT(${borrowRecords.id})`), desc(books.rating))
    .limit(limit);

  // Fetch saved counts separately and merge
  const candidateIds = rows.map((r) => r.id);
  const savedCounts =
    candidateIds.length > 0
      ? await db
          .select({
            bookId: savedBooks.bookId,
            savedCount: count(savedBooks.id),
          })
          .from(savedBooks)
          .where(inArray(savedBooks.bookId, candidateIds))
          .groupBy(savedBooks.bookId)
      : [];

  const savedMap = new Map(savedCounts.map((r) => [r.bookId, r.savedCount]));

  return rows.map((r) => ({
    ...r,
    savedCount: savedMap.get(r.id) ?? 0,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// AI-enhanced trending: AI ranks candidates; falls back automatically
// ─────────────────────────────────────────────────────────────────────────────

const parseTrendingIds = (content: string): string[] => {
  const normalized = content
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const candidates = [
    normalized,
    normalized.match(/\[[\s\S]*\]/)?.[0],
    normalized.match(/\{[\s\S]*"ids"\s*:\s*\[[\s\S]*\][\s\S]*\}/)?.[0],
    normalized.match(/\{[\s\S]*"bookIds"\s*:\s*\[[\s\S]*\][\s\S]*\}/)?.[0],
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string");
      }

      if (parsed && Array.isArray((parsed as { ids?: unknown }).ids)) {
        return (parsed as { ids: unknown[] }).ids.filter(
          (value): value is string => typeof value === "string"
        );
      }

      if (parsed && Array.isArray((parsed as { bookIds?: unknown }).bookIds)) {
        return (parsed as { bookIds: unknown[] }).bookIds.filter(
          (value): value is string => typeof value === "string"
        );
      }
    } catch {
      // Try the next extraction strategy.
    }
  }

  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// AI trending result cache
//
// Shared across users (NOT per-user). The cache key is derived from `limit` and
// the user's preferred genres only — `excludeIds` is intentionally left out so
// the cache is not fragmented per user. Cached value is the AI-ranked book ID
// list (AiCacheValue); full Book records are always re-queried from Neon.
// ─────────────────────────────────────────────────────────────────────────────

const TRENDING_CACHE_TTL_SECONDS = 86400; // 24 hours

const hashPreferredGenres = (preferredGenres: string[]): string =>
  createHash("sha256")
    .update(JSON.stringify(preferredGenres))
    .digest("hex");

const buildTrendingCacheKey = (
  preferredGenres: string[],
  limit: number
): string => `ai:trending:${limit}:${hashPreferredGenres(preferredGenres)}`;

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
 * - Filters out the current request's `excludeIds` and unavailable books.
 * - Preserves the cached AI ranking/order.
 * - Fills any shortfall with the existing popular-book fallback (NO Groq call).
 */
const hydrateTrendingFromCache = async (
  ids: string[],
  excludeIds: string[],
  limit: number
): Promise<Book[]> => {
  const { getPopularBooks } = await import("@/lib/recommendations");

  const remainingIds = ids.filter((id) => !excludeIds.includes(id));

  if (remainingIds.length === 0) {
    return getPopularBooks(excludeIds, limit);
  }

  const rows = (await db
    .select()
    .from(books)
    .where(
      and(inArray(books.id, remainingIds), gt(books.availableCopies, 0))
    )) as unknown as Book[];

  const rowsById = new Map(rows.map((b) => [b.id, b]));

  // Preserve the cached AI ranking/order.
  const ordered = remainingIds
    .map((id) => rowsById.get(id))
    .filter((b): b is Book => b !== undefined);

  if (ordered.length < limit) {
    const supplement = await getPopularBooks(
      [...excludeIds, ...ordered.map((b) => b.id)],
      limit - ordered.length
    );
    return [...ordered, ...supplement];
  }

  return ordered.slice(0, limit);
};

export const getAiTrendingBooks = async (
  excludeIds: string[] = [],
  preferredGenres: string[] = [],
  limit = 6
): Promise<Book[]> => {
  const { getPopularBooks } = await import("@/lib/recommendations");

  // ── Cache lookup (best-effort; miss/Redis failure → normal AI flow) ──
  const cacheKey = buildTrendingCacheKey(preferredGenres, limit);
  const cached = await getCacheJson<AiCacheValue>(cacheKey);

  if (isValidCacheValue(cached)) {
    try {
      return await hydrateTrendingFromCache(cached.ids, excludeIds, limit);
    } catch (error) {
      console.warn(
        "Trending cache hydration failed, running AI flow:",
        error
      );
    }
  }

  try {
    const candidates = await getTrendingCandidates(excludeIds, 40);

    if (candidates.length === 0) {
      return getPopularBooks(excludeIds, limit);
    }

    const isNewlyAdded = (createdAt: Date | null) => {
      if (!createdAt) return false;
      const days =
        (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    };

    const catalogueSummary = candidates
      .map(
        (b) =>
          `${b.id} | ${b.title} | ${b.genre} | borrows_7d:${b.recentBorrows} | saves:${b.savedCount} | rating:${b.rating}${isNewlyAdded(b.createdAt) ? " | NEW" : ""}`
      )
      .join("\n");

    const personalizationNote =
      preferredGenres.length > 0
        ? `\nThe user prefers these genres: ${preferredGenres.join(", ")}. Slightly favour books in those genres when scores are close.`
        : "";

    const prompt = `You are a library trending-books engine.

We have a list of library books with the following signals:
- id | title | genre | borrows in last 7 days | total saves | rating | NEW (added in last 14 days)

Book list:
${catalogueSummary}
${personalizationNote}

Rank and select the top ${limit} books that are trending right now.
Consider: recent borrow activity, saves, high rating, and newly added books.
Return ONLY a JSON array of the ${limit} book IDs ordered from most to least trending.
Example: ["id1","id2","id3","id4","id5","id6"]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let aiResult;
    try {
      aiResult = await callOpenRouterChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        maxTokens: 150,
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        console.warn("AI trending-books request timed out, falling back.");
        return getPopularBooks(excludeIds, limit);
      }
      console.warn("AI trending-books API error, falling back.", err?.message ?? err);
      return getPopularBooks(excludeIds, limit);
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResult || !aiResult.ok) {
      console.warn("AI trending-books returned no result or failed, falling back.");
      return getPopularBooks(excludeIds, limit);
    }

    const rawContent: string = aiResult.content;

    let rankedIds: string[] = [];
    try {
      rankedIds = parseTrendingIds(rawContent);
      if (!Array.isArray(rankedIds) || rankedIds.length === 0) {
        throw new Error("Parsed trending response did not contain a usable array");
      }
    } catch {
      console.warn("Failed to parse AI trending response, falling back.");
      return getPopularBooks(excludeIds, limit);
    }

    const validIds = rankedIds.filter((id) =>
      candidates.some((c) => c.id === id)
    );

    if (validIds.length === 0) {
      return getPopularBooks(excludeIds, limit);
    }

    // Best-effort cache write of the AI-ranked IDs (only after AI success).
    // Never caches fallback/popular results, and a cache failure must never
    // break the AI result path.
    await setCacheJson(
      cacheKey,
      { ids: validIds.slice(0, limit), generatedAt: new Date().toISOString() },
      TRENDING_CACHE_TTL_SECONDS
    );

    // Map candidates to full Book objects preserving AI order
    const ordered = validIds
      .slice(0, limit)
      .map((id) => candidates.find((c) => c.id === id))
      .filter((b): b is BookCandidate => b !== undefined) as unknown as Book[];

    // Supplement if AI returned fewer than requested
    if (ordered.length < limit) {
      const supplement = await getPopularBooks(
        [...excludeIds, ...ordered.map((b) => b.id)],
        limit - ordered.length
      );
      return [...ordered, ...supplement];
    }

    return ordered;
  } catch (error) {
    console.error("AI trending-books failed, using fallback:", error);
    const { getPopularBooks } = await import("@/lib/recommendations");
    return getPopularBooks(excludeIds, limit);
  }
};
