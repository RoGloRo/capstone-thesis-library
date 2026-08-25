import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId, isAdminUser } from "@/lib/auth-guard";

const VALID_ROLES = new Set(["USER", "ADMIN"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = id;

    // Must be authenticated at all.
    const authenticatedUserId = await getAuthenticatedUserId();
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Must be an admin. A normal USER (or any non-admin) cannot change any role,
    // including their own.
    if (!(await isAdminUser())) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Only the supported roles can ever be written.
    if (!VALID_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be USER or ADMIN." },
        { status: 400 }
      );
    }

    // Update the user's role in the database
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}

