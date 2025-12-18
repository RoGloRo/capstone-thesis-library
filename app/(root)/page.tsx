import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import { db } from "@/database/drizzle";
import { books, borrowRecords, savedBooks } from "@/database/schema";
import { auth } from "@/auth";
import { and, desc, eq, inArray, not, sql, gt, count } from "drizzle-orm";

interface UserPreferences {
  genres: { genre: string; weight: number }[];
  authors: { author: string; weight: number }[];
  avgRating: number;
  excludeBookIds: string[];
}

/**
 * Enhanced Book Recommendation System
 * 
 * This system analyzes multiple data sources to provide personalized recommendations:
 * 1. Reading History: All borrowed books (returned and currently borrowed)
 * 2. Favorite Books: User's saved/bookmarked books 
 * 3. User Behavior Patterns: Completion rates, rating preferences, genre diversity
 * 
 * Recommendation Logic:
 * - Weighted preferences based on user actions (favorites > completed > borrowed)
 * - Time-decay for older interactions to prioritize recent interests
 * - Multi-criteria matching (genre, author, rating similarity)
 * - Fallback to trending/popular books for new users
 */
const getRecommendedBooks = async (userId: string) => {
  try {
    // Get user's complete reading history
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
      .orderBy(desc(borrowRecords.borrowDate)); // Most recent first

    // Get user's saved/favorited books
    const favoriteBooks = await db
      .select({
        genre: books.genre,
        author: books.author,
        rating: books.rating,
        bookId: books.id,
        savedAt: savedBooks.savedAt,
      })
      .from(savedBooks)
      .innerJoin(books, eq(savedBooks.bookId, books.id))
      .where(eq(savedBooks.userId, userId))
      .orderBy(desc(savedBooks.savedAt)); // Most recently saved first

    // If no user data available, fall back to popular books
    if (readingHistory.length === 0 && favoriteBooks.length === 0) {
      return await getPopularBooks([], 6);
    }

    // Analyze user preferences with advanced weighting
    const preferences = analyzeUserPreferences(readingHistory, favoriteBooks);

    // Get personalized recommendations
    const recommendedBooks = await getPersonalizedRecommendations(preferences);

    return recommendedBooks;
  } catch (error) {
    console.error('Error getting recommended books:', error);
    // Fallback to popular books on error
    return await getPopularBooks([], 6);
  }
};

const analyzeUserPreferences = (
  readingHistory: Array<{
    genre: string;
    author: string;
    rating: number;
    bookId: string;
    returnDate?: string | null;
    borrowDate?: Date;
  }>, 
  favoriteBooks: Array<{
    genre: string;
    author: string;
    rating: number;
    bookId: string;
    savedAt?: Date;
  }>
): UserPreferences => {
  // Combine all user book interactions with different weights
  const allBooks = [...readingHistory, ...favoriteBooks];
  
  // Advanced weighting system
  const weightedBooks = allBooks.map(book => {
    let weight = 1; // Base weight for borrowed books
    
    // Higher weight for favorited books
    if (favoriteBooks.some(fav => fav.bookId === book.bookId)) {
      weight += 2; // Favorited books get +2 weight
    }
    
    // Higher weight for completed books (returned books)
    if ('returnDate' in book && book.returnDate) {
      weight += 1; // Completed books get +1 weight
    }
    
    // Weight based on rating (higher rated books get more weight)
    if (book.rating >= 4) {
      weight += 0.5;
    }
    
    return {
      ...book,
      weight
    };
  });

  // Analyze genre preferences with decay for older interactions
  const genreMap = new Map<string, number>();
  weightedBooks.forEach(book => {
    const current = genreMap.get(book.genre) || 0;
    
    // Apply time decay for reading history (more recent = higher weight)
    let timeWeight = 1;
    if ('returnDate' in book && book.returnDate) {
      const daysSinceReturn = Math.floor(
        (Date.now() - new Date(book.returnDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      timeWeight = Math.max(0.3, 1 - (daysSinceReturn / 365)); // Decay over a year
    }
    
    genreMap.set(book.genre, current + (book.weight * timeWeight));
  });

  const genres = Array.from(genreMap.entries())
    .map(([genre, weight]) => ({ genre, weight }))
    .filter(g => g.weight > 0.5) // Filter out very low weights
    .sort((a, b) => b.weight - a.weight);

  // Analyze author preferences
  const authorMap = new Map<string, number>();
  weightedBooks.forEach(book => {
    const current = authorMap.get(book.author) || 0;
    
    // Authors get higher weight if user has multiple books by them
    const authorBookCount = weightedBooks.filter(b => b.author === book.author).length;
    const authorMultiplier = Math.min(2, 1 + (authorBookCount - 1) * 0.3);
    
    authorMap.set(book.author, current + (book.weight * authorMultiplier));
  });

  const authors = Array.from(authorMap.entries())
    .map(([author, weight]) => ({ author, weight }))
    .filter(a => a.weight > 0.8) // Filter out very low weights
    .sort((a, b) => b.weight - a.weight);

  // Calculate weighted average rating preference
  const totalWeight = weightedBooks.reduce((sum, book) => sum + book.weight, 0);
  const weightedRatingSum = weightedBooks.reduce((sum, book) => sum + (book.rating * book.weight), 0);
  const avgRating = totalWeight > 0 ? weightedRatingSum / totalWeight : 4;

  // Books to exclude (already read/saved)
  const excludeBookIds = Array.from(new Set(allBooks.map(book => book.bookId)));

  return {
    genres,
    authors,
    avgRating,
    excludeBookIds
  };
};

const getPersonalizedRecommendations = async (preferences: UserPreferences): Promise<Book[]> => {
  const { genres, authors, avgRating, excludeBookIds } = preferences;

  // Get multiple recommendation sets and merge them
  const recommendationSets = [];

  // 1. Genre-based recommendations (strongest signal)
  if (genres.length > 0) {
    const topGenres = genres.slice(0, 3).map(g => g.genre);
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

  // 2. Author-based recommendations
  if (authors.length > 0) {
    const topAuthors = authors.slice(0, 2).map(a => a.author);
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

  // 3. Rating-based recommendations (similar rating range)
  const ratingRange = {
    min: Math.max(1, Math.floor(avgRating) - 1),
    max: Math.min(5, Math.ceil(avgRating) + 1)
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

  // Remove duplicates while preserving order (first occurrence kept)
  const uniqueRecommendations = recommendationSets.filter(
    (book, index, arr) => arr.findIndex(b => b.id === book.id) === index
  );

  // If we have enough recommendations, return top ones
  if (uniqueRecommendations.length >= 6) {
    return uniqueRecommendations.slice(0, 6);
  }

  // Supplement with popular books that match user preferences
  const supplementalBooks = await getPopularBooks(
    [...excludeBookIds, ...uniqueRecommendations.map(b => b.id)], 
    6 - uniqueRecommendations.length
  );

  return [...uniqueRecommendations, ...supplementalBooks].slice(0, 6);
};

const getPopularBooks = async (excludeIds: string[] = [], limit: number = 6): Promise<Book[]> => {
  // Get popular books based on recent borrow activity and rating
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Try to get trending books (most borrowed in last 30 days)
  const trendingBooksQuery = db
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
      borrowCount: count(borrowRecords.id)
    })
    .from(books)
    .leftJoin(borrowRecords, 
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
    .limit(limit);

  const trendingBooks = (await trendingBooksQuery) as unknown as Book[];

  // If we have enough trending books, return them
  if (trendingBooks.length >= limit) {
    return trendingBooks;
  }

  // Otherwise, supplement with highly rated books
  const conditions = [gt(books.availableCopies, 0)];
  
  if (excludeIds.length > 0) {
    conditions.push(not(inArray(books.id, excludeIds)));
  }

  const remainingBooks = (await db
    .select()
    .from(books)
    .where(and(...conditions))
    .orderBy(desc(books.rating), desc(books.createdAt))
    .limit(limit - trendingBooks.length)) as unknown as Book[];

  return [...trendingBooks, ...remainingBooks];
};

const Home = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  // Get the latest books
  const latestBooks = (await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt))
    .limit(10)) as unknown as Book[];

  // Get recommended books if user is logged in
  const recommendedBooks = userId 
    ? await getRecommendedBooks(userId) 
    : [];

  // Get trending/popular books for all users
  const trendingBooks = await getPopularBooks(
    userId ? recommendedBooks.map(book => book.id) : [],
    6
  );

  const firstSection = 'mt-28';
  const secondSection = 'mt-16';
  const thirdSection = 'mt-16';

  return (
    <>
      <BookOverview {...latestBooks[0]} userId={userId || ''} />

      {recommendedBooks.length > 0 && (
        <BookList
          title="Recommended For You"
          books={recommendedBooks}
          containerClassName={firstSection}
        />
      )}

      {trendingBooks.length > 0 && (
        <BookList
          title={recommendedBooks.length > 0 ? "Trending Now" : "Popular Books"}
          books={trendingBooks}
          containerClassName={recommendedBooks.length > 0 ? secondSection : firstSection}
        />
      )}

      <BookList
        title="Latest Additions"
        books={latestBooks.slice(1)}
        containerClassName={
          recommendedBooks.length > 0 && trendingBooks.length > 0 
            ? thirdSection 
            : (recommendedBooks.length > 0 || trendingBooks.length > 0) 
              ? secondSection 
              : firstSection
        }
      />
    </>
  );
};

export default Home;
