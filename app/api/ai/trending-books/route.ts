import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getAiTrendingBooks } from "@/lib/trending-books";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const excludeParam = searchParams.get("exclude");
    const excludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "6", 10), 10);

    // Optionally personalise by the logged-in user's preferred genres
    const session = await auth();
    let preferredGenres: string[] = [];
    if (session?.user?.id) {
      const [userData] = await db
        .select({ preferredGenres: users.preferredGenres })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      if (userData?.preferredGenres) {
        try {
          preferredGenres = JSON.parse(userData.preferredGenres);
        } catch {
          // ignore malformed JSON
        }
      }
    }

    const trendingBooks = await getAiTrendingBooks(excludeIds, preferredGenres, limit);

    return NextResponse.json({ trendingBooks });
  } catch (error) {
    console.error("GET /api/ai/trending-books error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending books" },
      { status: 500 }
    );
  }
}
