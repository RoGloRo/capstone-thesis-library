import { db } from "@/database/drizzle";
import { users, borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [userToDelete] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userToDelete) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has any borrow records
    const userBorrowRecords = await db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.userId, userId))
      .limit(1);

    if (userBorrowRecords.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete user with active borrow records",
          details: "This user has books borrowed or borrow history. Please ensure all books are returned and records are cleared before deletion."
        },
        { status: 409 } // Conflict status
      );
    }

    // Delete the user from the database
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deletedUser) {
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "User deleted successfully",
        deletedUser: {
          id: deletedUser.id,
          fullName: deletedUser.fullName,
          email: deletedUser.email
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    
    // Handle specific database constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
      return NextResponse.json(
        { 
          error: "Cannot delete user due to existing references",
          details: "This user has associated records (borrow history, etc.) that prevent deletion."
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
