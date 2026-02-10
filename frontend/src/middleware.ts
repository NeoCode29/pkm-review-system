import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

const ROLE_PREFIXES: Record<string, string> = {
  mahasiswa: '/mahasiswa',
  reviewer: '/reviewer',
  admin: '/admin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check auth from cookie (Zustand persist uses localStorage, so we check
  // a lightweight cookie set by the client for middleware access)
  const authCookie = request.cookies.get('pkm-auth-token');

  if (!authCookie?.value) {
    // Not authenticated — redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const roleCookie = request.cookies.get('pkm-auth-role');
  const role = roleCookie?.value;

  if (role) {
    const allowedPrefix = ROLE_PREFIXES[role];
    if (allowedPrefix && !pathname.startsWith(allowedPrefix) && pathname !== '/') {
      // User trying to access a route not matching their role
      return NextResponse.redirect(new URL(`${allowedPrefix}/dashboard`, request.url));
    }
  }

  // Root path — redirect to role dashboard
  if (pathname === '/') {
    if (role && ROLE_PREFIXES[role]) {
      return NextResponse.redirect(
        new URL(`${ROLE_PREFIXES[role]}/dashboard`, request.url),
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
