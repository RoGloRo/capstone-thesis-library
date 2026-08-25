import { NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUserId, isAdminUser } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Must be authenticated. The admin-status of an arbitrary id must not be
    // observable by unauthenticated callers.
    const authenticatedUserId = await getAuthenticatedUserId();
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // The Header only asks about the currently logged-in user, so allow that.
    // Admins may look up any user. Everyone else cannot query other ids.
    const isSelf = authenticatedUserId === id;
    const isAdmin = await isAdminUser();
    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isAdmin: user.role === 'ADMIN'
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json(
      { error: 'Failed to check user role' },
      { status: 500 }
    );
  }
}
