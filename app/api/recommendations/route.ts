import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAiEnhancedRecommendations } from "@/lib/recommendations";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ recommendedBooks: [] });
    }

    const recommendedBooks = await getAiEnhancedRecommendations(session.user.id);

    return NextResponse.json({ recommendedBooks });
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
