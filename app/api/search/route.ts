// Create a new file: app/api/search/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { books } from '@/database/schema';
import { ilike, or, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      type: sql<string>`'book'`,
    })
    .from(books)
    .where(
      or(
        ilike(books.title, searchTerm),
        ilike(books.author, searchTerm),
        ilike(books.genre, searchTerm)
      )
    )
    .limit(5);

  return NextResponse.json(results);
}