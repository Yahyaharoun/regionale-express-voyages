import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  // Pass if no secret (will crash in auth.ts anyway, but let's be safe here)
  if (!JWT_SECRET) return NextResponse.next();

  const key = new TextEncoder().encode(JWT_SECRET);

  const { pathname } = request.nextUrl;

  // Ignorer les requêtes statiques et l'API de login
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/login' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Protection
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Vérification stricte du JWT (Edge-compatible)
    await jwtVerify(token, key, { algorithms: ['HS256'] });
    return NextResponse.next();
  } catch (error) {
    // Token invalide ou expiré
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login route)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
