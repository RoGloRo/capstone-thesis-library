import { db } from "@/database/drizzle";
import { books, borrowRecords, savedBooks } from "@/database/schema";
import { and, count, desc, eq, gt, inArray, not, sql } from "drizzle-orm";

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
// AI-enhanced trending: GPT-4o-mini ranks candidates; falls back automatically
// ─────────────────────────────────────────────────────────────────────────────

export const getAiTrendingBooks = async (
  excludeIds: string[] = [],
  preferredGenres: string[] = [],
  limit = 6
): Promise<Book[]> => {
  const { getPopularBooks } = await import("@/lib/recommendations");

  if (!process.env.GITHUB_TOKEN) {
    return getPopularBooks(excludeIds, limit);
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
      console.warn("AI trending-books API error, falling back.");
      return getPopularBooks(excludeIds, limit);
    }

    const aiData = await aiResponse.json();
    const rawContent: string =
      aiData.choices?.[0]?.message?.content?.trim() ?? "";

    let rankedIds: string[] = [];
    try {
      const cleaned = rawContent.replace(/```(?:json)?|```/g, "").trim();
      rankedIds = JSON.parse(cleaned);
      if (!Array.isArray(rankedIds)) throw new Error("Not an array");
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
