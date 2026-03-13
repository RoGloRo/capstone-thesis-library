import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getAiSimilarBooks, getBorrowedBookIds } from "@/lib/book-match";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json(
        { error: "bookId query parameter is required" },
        { status: 400 }
      );
    }

    const [currentBook] = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        description: books.description,
      })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!currentBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Optionally exclude books the logged-in user has already borrowed
    const session = await auth();
    const excludeBookIds = session?.user?.id
      ? await getBorrowedBookIds(session.user.id)
      : [];

    const similarBooks = await getAiSimilarBooks(currentBook, excludeBookIds, 5);

    return NextResponse.json({ similarBooks });
  } catch (error) {
    console.error("GET /api/book-match error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar books" },
      { status: 500 }
    );
  }
}
