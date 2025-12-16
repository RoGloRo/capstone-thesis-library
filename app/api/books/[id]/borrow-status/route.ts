import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords } from "@/database/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const [record] = await db
      .select({ id: borrowRecords.id })
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, userId),
          eq(borrowRecords.bookId, id),
          eq(borrowRecords.status, "BORROWED")
        )
      )
      .limit(1);

    return NextResponse.json({
      hasBorrowed: !!record,
      borrowRecordId: record?.id || null,
    });
  } catch (error) {
    console.error("Error checking borrow status:", error);
    return NextResponse.json(
      { error: "Failed to check borrow status" },
      { status: 500 }
    );
  }
}