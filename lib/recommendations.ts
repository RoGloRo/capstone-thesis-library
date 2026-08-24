import { db } from "@/database/drizzle";
import { books, borrowRecords, users, savedBooks } from "@/database/schema";
import { getCacheJson, setCacheJson, type AiCacheValue } from "@/lib/ai-cache";
import { callOpenRouterChat } from "@/lib/openrouter";
import { and, desc, eq, gt, inArray, not, sql, count } from "drizzle-orm";

interface UserPreferences {
  genres: { genre: string; weight: number }[];
  authors: { author: string; weight: number }[];
  avgRating: number;
  excludeBookIds: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Core helpers (unchanged from original page.tsx logic)
// ─────────────────────────────────────────────────────────────────────────────

const analyzeUserPreferences = (
  readingHistory: Array<{
    genre: string;
    author: string;
    rating: number;
    bookId: string;
    returnDate?: string | null;
    borrowDate?: Date;
  }>
): UserPreferences => {
  const allBooks = [...readingHistory];

  const weightedBooks = allBooks.map((book) => {
    let weight = 1;
    if ("returnDate" in book && book.returnDate) weight += 1;
    if (book.rating >= 4) weight += 0.5;
    return { ...book, weight };
  });

  const genreMap = new Map<string, number>();
  weightedBooks.forEach((book) => {
    const current = genreMap.get(book.genre) || 0;
    let timeWeight = 1;
    if ("returnDate" in book && book.returnDate) {
      const daysSinceReturn = Math.floor(
        (Date.now() - new Date(book.returnDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      timeWeight = Math.max(0.3, 1 - daysSinceReturn / 365);
    }
    genreMap.set(book.genre, current + book.weight * timeWeight);
  });

  const genres = Array.from(genreMap.entries())
    .map(([genre, weight]) => ({ genre, weight }))
    .filter((g) => g.weight > 0.5)
    .sort((a, b) => b.weight - a.weight);

  const authorMap = new Map<string, number>();
  weightedBooks.forEach((book) => {
    const current = authorMap.get(book.author) || 0;
    const authorBookCount = weightedBooks.filter((b) => b.author === book.author).length;
    const authorMultiplier = Math.min(2, 1 + (authorBookCount - 1) * 0.3);
    authorMap.set(book.author, current + book.weight * authorMultiplier);
  });

  const authors = Array.from(authorMap.entries())
    .map(([author, weight]) => ({ author, weight }))
    .filter((a) => a.weight > 0.8)
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = weightedBooks.reduce((sum, book) => sum + book.weight, 0);
  const weightedRatingSum = weightedBooks.reduce(
    (sum, book) => sum + book.rating * book.weight,
    0
  );
  const avgRating = totalWeight > 0 ? weightedRatingSum / totalWeight : 4;

  const excludeBookIds = Array.from(new Set(allBooks.map((book) => book.bookId)));

  return { genres, authors, avgRating, excludeBookIds };
};

export const getPopularBooks = async (
  excludeIds: string[] = [],
  limit: number = 6
): Promise<Book[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendingBooks = (await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      rating: books.rating,
      coverUrl: books.coverUrl,
      coverColor: books.coverColor,
      description: books.description,
      totalCopies: books.totalCopies,
      availableCopies: books.availableCopies,
      videoUrl: books.videoUrl,
      summary: books.summary,
      createdAt: books.createdAt,
      borrowCount: count(borrowRecords.id),
    })
    .from(books)
    .leftJoin(
      borrowRecords,
      and(
        eq(borrowRecords.bookId, books.id),
        sql`${borrowRecords.borrowDate} >= ${thirtyDaysAgo.toISOString()}`
      )
    )
    .where(
      excludeIds.length > 0
        ? and(gt(books.availableCopies, 0), not(inArray(books.id, excludeIds)))
        : gt(books.availableCopies, 0)
    )
    .groupBy(books.id)
    .orderBy(desc(sql`COUNT(${borrowRecords.id})`), desc(books.rating))
    .limit(limit)) as unknown as Book[];

  if (trendingBooks.length >= limit) return trendingBooks;

  const conditions = [gt(books.availableCopies, 0)];
  if (excludeIds.length > 0) conditions.push(not(inArray(books.id, excludeIds)));

  const remainingBooks = (await db
    .select()
    .from(books)
    .where(and(...conditions))
    .orderBy(desc(books.rating), desc(books.createdAt))
    .limit(limit - trendingBooks.length)) as unknown as Book[];

  return [...trendingBooks, ...remainingBooks];
};

const getPersonalizedRecommendations = async (
  preferences: UserPreferences
): Promise<Book[]> => {
  const { genres, authors, avgRating, excludeBookIds } = preferences;
  const recommendationSets: Book[] = [];

  if (genres.length > 0) {
    const topGenres = genres.slice(0, 3).map((g) => g.genre);
    const genreBooks = (await db
      .select()
      .from(books)
      .where(
        and(
          gt(books.availableCopies, 0),
          not(inArray(books.id, excludeBookIds)),
          inArray(books.genre, topGenres),
          sql`${books.rating} >= ${Math.max(3, Math.floor(avgRating) - 1)}`
        )
      )
      .orderBy(desc(books.rating))
      .limit(4)) as unknown as Book[];
    recommendationSets.push(...genreBooks);
  }

  if (authors.length > 0) {
    const topAuthors = authors.slice(0, 2).map((a) => a.author);
    const authorBooks = (await db
      .select()
      .from(books)
      .where(
        and(
          gt(books.availableCopies, 0),
          not(inArray(books.id, excludeBookIds)),
          inArray(books.author, topAuthors)
        )
      )
      .orderBy(desc(books.rating))
      .limit(3)) as unknown as Book[];
    recommendationSets.push(...authorBooks);
  }

  const ratingRange = {
    min: Math.max(1, Math.floor(avgRating) - 1),
    max: Math.min(5, Math.ceil(avgRating) + 1),
  };

  const ratingBooks = (await db
    .select()
    .from(books)
    .where(
      and(
        gt(books.availableCopies, 0),
        not(inArray(books.id, excludeBookIds)),
        sql`${books.rating} BETWEEN ${ratingRange.min} AND ${ratingRange.max}`
      )
    )
    .orderBy(desc(books.rating), desc(books.createdAt))
    .limit(3)) as unknown as Book[];
  recommendationSets.push(...ratingBooks);

  const unique = recommendationSets.filter(
    (book, index, arr) => arr.findIndex((b) => b.id === book.id) === index
  );

  if (unique.length >= 6) return unique.slice(0, 6);

  const supplement = await getPopularBooks(
    [...excludeBookIds, ...unique.map((b) => b.id)],
    6 - unique.length
  );
  return [...unique, ...supplement].slice(0, 6);
};

/**
 * Existing recommendation logic (unchanged).
 * Acts as the fallback when AI is unavailable or returns empty results.
 */
export const getRecommendedBooks = async (userId: string): Promise<Book[]> => {
  try {
    const readingHistory = await db
      .select({
        genre: books.genre,
        author: books.author,
        rating: books.rating,
        bookId: books.id,
        returnDate: borrowRecords.returnDate,
        borrowDate: borrowRecords.borrowDate,
      })
      .from(borrowRecords)
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(eq(borrowRecords.userId, userId))
      .orderBy(desc(borrowRecords.borrowDate));

    // New user: no borrow history → use preferred genres if set
    if (readingHistory.length === 0) {
      const [userData] = await db
        .select({ preferredGenres: users.preferredGenres })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const preferredGenres: string[] = userData?.preferredGenres
        ? JSON.parse(userData.preferredGenres)
        : [];

      if (preferredGenres.length > 0) {
        const genreBooks = (await db
          .select()
          .from(books)
          .where(inArray(books.genre, preferredGenres))
          .orderBy(desc(books.rating), desc(books.createdAt))
          .limit(6)) as unknown as Book[];

        if (genreBooks.length >= 3) return genreBooks;
        const supplement = await getPopularBooks(
          genreBooks.map((b) => b.id),
          6 - genreBooks.length
        );
        return [...genreBooks, ...supplement];
      }

      return await getPopularBooks([], 6);
    }

    // Existing user: analyze reading history
    const preferences = analyzeUserPreferences(readingHistory);

    // Blend in preferred genres at lower weight
    const [userData] = await db
      .select({ preferredGenres: users.preferredGenres })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const preferredGenres: string[] = userData?.preferredGenres
      ? JSON.parse(userData.preferredGenres)
      : [];

    if (preferredGenres.length > 0) {
      const borrowedGenreNames = preferences.genres.map((g) => g.genre);
      for (const genre of preferredGenres) {
        if (!borrowedGenreNames.includes(genre)) {
          preferences.genres.push({ genre, weight: 0.5 });
        }
      }
    }

    return await getPersonalizedRecommendations(preferences);
  } catch (error) {
    console.error("Error getting recommended books:", error);
    return await getPopularBooks([], 6);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AI recommendation result cache
//
// STRICTLY per-user. The cache key always contains the authenticated user's ID
// (`ai:recs:{userId}`) so recommendations can never leak between users. Cached
// value is the AI-ranked book ID list (AiCacheValue); full Book records are
// always re-queried from Neon on a hit. TTL is a safety net only — user-action
// invalidation is handled in a later step.
// ─────────────────────────────────────────────────────────────────────────────

const RECOMMENDATIONS_CACHE_TTL_SECONDS = 86400; // 24 hours
const RECOMMENDATIONS_LIMIT = 6;

const buildRecommendationsCacheKey = (userId: string): string =>
  `ai:recs:${userId}`;

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
 * - Re-queries Neon for the cached IDs (fresh availability/rating/etc.).
 * - Ignores IDs that no longer exist or are no longer available.
 * - Preserves the cached AI ranking/order.
 * - Fills any shortfall with the existing popular-book fallback (NO Groq call).
 */
const hydrateRecommendationsFromCache = async (
  ids: string[],
  excludeIds: string[] = []
): Promise<Book[]> => {
  const rows = (await db
    .select()
    .from(books)
    .where(and(inArray(books.id, ids), gt(books.availableCopies, 0)))) as unknown as Book[];

  const rowsById = new Map(rows.map((b) => [b.id, b]));

  // Preserve the cached AI ranking/order.
  const ordered = ids
    .map((id) => rowsById.get(id))
    .filter((b): b is Book => b !== undefined);

  if (ordered.length >= RECOMMENDATIONS_LIMIT) {
    return ordered.slice(0, RECOMMENDATIONS_LIMIT);
  }

  const supplement = await getPopularBooks(
    [...excludeIds, ...ids, ...ordered.map((b) => b.id)],
    RECOMMENDATIONS_LIMIT - ordered.length
  );
  return [...ordered, ...supplement].slice(0, RECOMMENDATIONS_LIMIT);
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Enhancement Layer
// Attempts AI assistance first; falls back to getRecommendedBooks on any failure.
// ─────────────────────────────────────────────────────────────────────────────

export const getAiEnhancedRecommendations = async (userId: string): Promise<Book[]> => {
  try {
    // ── Cache lookup (best-effort; miss/Redis failure → normal AI flow) ──
    const cacheKey = buildRecommendationsCacheKey(userId);
    const cached = await getCacheJson<AiCacheValue>(cacheKey);

    if (isValidCacheValue(cached)) {
      try {
        return await hydrateRecommendationsFromCache(cached.ids);
      } catch (error) {
        console.warn(
          "Recommendations cache hydration failed, running AI flow:",
          error
        );
      }
    }

    // Gather user context in parallel
    const [userDataResult, borrowHistory, savedBooksResult] = await Promise.all([
      db
        .select({ preferredGenres: users.preferredGenres })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          bookId: books.id,
          title: books.title,
          genre: books.genre,
        })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .where(eq(borrowRecords.userId, userId))
        .orderBy(desc(borrowRecords.borrowDate))
        .limit(20),
      db
        .select({ bookId: savedBooks.bookId })
        .from(savedBooks)
        .where(eq(savedBooks.userId, userId)),
    ]);

    const preferredGenres: string[] = userDataResult[0]?.preferredGenres
      ? JSON.parse(userDataResult[0].preferredGenres)
      : [];
    const borrowedBookIds = borrowHistory.map((b) => b.bookId);
    const savedBookIds = savedBooksResult.map((s) => s.bookId);

    // Fetch catalogue the user hasn't borrowed yet (cap at 60 for prompt size)
    const availableBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
      })
      .from(books)
      .where(
        borrowedBookIds.length > 0
          ? and(gt(books.availableCopies, 0), not(inArray(books.id, borrowedBookIds)))
          : gt(books.availableCopies, 0)
      )
      .orderBy(desc(books.rating))
      .limit(60);

    if (availableBooks.length === 0) return getRecommendedBooks(userId);

    const prompt = `You are a library recommendation engine.

User preferred genres: ${preferredGenres.length > 0 ? preferredGenres.join(", ") : "Not specified"}
Borrowed books: ${
      borrowHistory.length > 0
        ? borrowHistory.map((b) => `${b.title} (${b.genre})`).join(", ")
        : "None yet"
    }
Saved books count: ${savedBookIds.length}

Available catalogue (id | title | author | genre):
${availableBooks.map((b) => `${b.id} | ${b.title} | ${b.author} | ${b.genre}`).join("\n")}

Return ONLY a JSON array of the top 6 book IDs most suitable for this user, ordered by relevance.
Example: ["id1","id2","id3","id4","id5","id6"]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let aiResult;
    try {
      aiResult = await callOpenRouterChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 150,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!aiResult.ok) {
      console.warn("AI recommendations API error, falling back to existing logic.");
      return getRecommendedBooks(userId);
    }

    const rawContent: string = aiResult.content;

    // Parse and validate the returned IDs
    let recommendedIds: string[] = [];
    try {
      // Strip markdown code fences if the model wraps in ```json
      const cleaned = rawContent.replace(/```(?:json)?|```/g, "").trim();
      recommendedIds = JSON.parse(cleaned);
      if (!Array.isArray(recommendedIds)) throw new Error("Not an array");
    } catch {
      console.warn("Failed to parse AI recommendation response, falling back.");
      return getRecommendedBooks(userId);
    }

    const validIds = recommendedIds.filter((id) =>
      availableBooks.some((b) => b.id === id)
    );

    if (validIds.length === 0) return getRecommendedBooks(userId);

    // Best-effort cache write of the AI-ranked IDs (only after AI success).
    // Never caches fallback results; a cache failure must never break the
    // recommendation result path.
    await setCacheJson(
      cacheKey,
      {
        ids: validIds.slice(0, RECOMMENDATIONS_LIMIT),
        generatedAt: new Date().toISOString(),
      },
      RECOMMENDATIONS_CACHE_TTL_SECONDS
    );

    const aiBooks = (await db
      .select()
      .from(books)
      .where(inArray(books.id, validIds))) as unknown as Book[];

    // Preserve AI ordering
    const orderedBooks = validIds
      .map((id) => aiBooks.find((b) => b.id === id))
      .filter((b): b is Book => b !== undefined);

    // Supplement if AI returned fewer than 6
    if (orderedBooks.length < 6) {
      const supplement = await getPopularBooks(
        [...borrowedBookIds, ...orderedBooks.map((b) => b.id)],
        6 - orderedBooks.length
      );
      return [...orderedBooks, ...supplement];
    }

    return orderedBooks;
  } catch (error) {
    // Any unexpected error → silent fallback
    console.error("AI recommendation layer failed, using fallback:", error);
    return getRecommendedBooks(userId);
  }
};
