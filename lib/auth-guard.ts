import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * Shared admin-authorization helpers.
 *
 * The database is the single source of truth for the user's role — the
 * JWT/session deliberately does NOT carry a `role` claim (it would go stale
 * after a role change). Every server-side admin decision should go through
 * these helpers so the DB role check is never duplicated or allowed to drift
 * between consumers.
 */

/** Returns the authenticated user id, or null when there is no session. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** True only when a session exists AND the DB role for that user is "ADMIN". */
export async function isAdminUser(): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const [res] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return res?.role === "ADMIN";
}
