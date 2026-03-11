import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { neon } from '@neondatabase/serverless'

const ONBOARDING_PATH = '/select-preferred-genres';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only enforce onboarding for authenticated users on non-auth/api paths
  const isPublicPath =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublicPath) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  // Not logged in — let the layout handle the redirect
  if (!token) return NextResponse.next();

  const onboardingCompleted = token.onboardingCompleted as boolean | undefined;

  // Only redirect to onboarding when the token EXPLICITLY has false (newly signed-up user).
  // undefined means an old token without the field — don’t force such users into onboarding.
  if (onboardingCompleted === false && pathname !== ONBOARDING_PATH) {
    // Fast path: server action sets this cookie right after saving genres.
    // Handles the case where the JWT cookie hasn't been refreshed yet.
    const bypassCookie = request.cookies.get('onboarding-done')?.value;
    if (bypassCookie === '1') {
      return NextResponse.next();
    }

    // Slow path: JWT is stale (bypass cookie already expired or wasn't set).
    // Query the DB directly — neon() is Edge-Runtime compatible.
    if (token.id) {
      try {
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT onboarding_completed
          FROM users
          WHERE id = ${token.id as string}
          LIMIT 1
        `;
        if (rows[0]?.onboarding_completed === true) {
          return NextResponse.next();
        }
      } catch {
        // DB unreachable — fail open so legitimate users aren't locked out.
        return NextResponse.next();
      }
    }

    return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
  }

  // If onboarding IS done and user tries to revisit the onboarding page → send home
  if (onboardingCompleted && pathname === ONBOARDING_PATH) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}