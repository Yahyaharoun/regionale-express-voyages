import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Autoriser localhost en dev et les sous-domaines vercel.app en prod
  const allowedOrigins = [
    'http://localhost:3000',
    'https://regionale-express-voyages.vercel.app',
    'https://www.regionale-express-voyages.vercel.app'
  ];

  const isAllowedOrigin = origin && allowedOrigins.some(o => origin.startsWith(o));

  // CSP Configuration
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://storage.googleapis.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://firebasestorage.googleapis.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    connect-src 'self' https://firebasestorage.googleapis.com https://fcmregistrations.googleapis.com https://*.supabase.co wss://*.supabase.co;
  `.replace(/\s{2,}/g, ' ').trim();
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // Default response object
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const { pathname } = request.nextUrl;

  // Handle preflight requests for CORS
  if (request.method === 'OPTIONS') {
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    return response;
  }

  // Set CORS headers for actual requests
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Security Headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Anti-CSRF on API routes (basic check)
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
     if (origin && !isAllowedOrigin) {
        return new NextResponse('Forbidden: Cross-Site Request Forgery detected.', { status: 403 });
     }
  }

  // JWT Verification Logic (Ported from proxy.ts)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/upload') ||
    pathname === '/login' ||
    pathname.includes('.')
  ) {
    return response; // bypass auth for these routes
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (JWT_SECRET) {
    const key = new TextEncoder().encode(JWT_SECRET);
    try {
      await jwtVerify(token, key, { algorithms: ['HS256'] });
    } catch (error) {
      // Token invalide ou expiré
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
      }
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      
      // Copy security headers to redirect response
      redirectResponse.headers.set('Content-Security-Policy', cspHeader);
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      redirectResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      
      redirectResponse.cookies.delete('auth-token');
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|sw\\.js|sw\\.js\\.map|workbox-.*).*)',
  ],
};
