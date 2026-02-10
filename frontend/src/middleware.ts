import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_PREFIXES: Record<string, string> = {
  mahasiswa: '/mahasiswa',
  reviewer: '/reviewer',
  admin: '/admin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const roleCookie = request.cookies.get('pkm-auth-role');
  const role = roleCookie?.value;

  // Root path — redirect based on cookie if available, otherwise to login
  if (pathname === '/') {
    if (role && ROLE_PREFIXES[role]) {
      return NextResponse.redirect(
        new URL(`${ROLE_PREFIXES[role]}/dashboard`, request.url),
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route guard (only when cookie is present)
  if (role) {
    const allowedPrefix = ROLE_PREFIXES[role];
    const isRolePath = Object.values(ROLE_PREFIXES).some((p) => pathname.startsWith(p));
    if (allowedPrefix && isRolePath && !pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(`${allowedPrefix}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
