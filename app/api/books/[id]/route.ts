// app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateBook } from "@/lib/admin/actions/book";
import { bookSchema } from "@/lib/validations";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import { books } from "@/database/schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validation = bookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid book data", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const result = await updateBook(id, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message || "Failed to update book" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.delete(books).where(eq(books.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { message: "Failed to delete book" },
      { status: 500 }
    );
  }
}