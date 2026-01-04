import { NextRequest, NextResponse } from 'next/server';

// Proxy: Route protection and redirects

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enterprise-grade routing: Allow dashboard and essential routes, redirect others to /register
  const allowedRoutes = ['/register', '/dashboard', '/documents', '/organizations', '/users', '/unauthorized', '/profile', '/settings', '/usage', '/folders', '/insights'];
  const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route));

  if (!isAllowedRoute) {
    const response = NextResponse.redirect(new URL('/register', request.url));
    // Add security headers only for redirects
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  // For allowed routes, just pass through without modifying headers
  // This ensures React hydration works properly
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match actual page routes, exclude all Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|css|js)$).*)',
  ],
};