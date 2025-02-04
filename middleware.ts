import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import type { JWT } from 'next-auth/jwt';

interface CustomJWT extends JWT {
  sessionId?: string;
  user?: {
    sessionId?: string;
    [key: string]: unknown;
  };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Add debug logging
  console.log('Middleware - Path:', path);

  // Define public paths that don't require authentication
  const isPublicPath = path === '/admin/login' || 
                      path.startsWith('/api/auth') ||
                      path === '/api/log' ||
                      path === '/favicon.ico';

  if (isPublicPath) {
    console.log('Middleware - Public path, allowing access');
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    }) as CustomJWT | null;

    console.log('Middleware - Token retrieved:', token ? 'yes' : 'no');

    // Redirect to login if trying to access a protected route without being authenticated
    if (!token || !token.user) {
      console.log('Middleware - No token found, redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // For API routes, verify the token has necessary data
    if (path.startsWith('/api/')) {
      if (!token.user?.email || !token.user?.sessionId) {
        console.log('Middleware - Invalid session for API route');
        return NextResponse.json(
          { 
            error: 'Unauthorized', 
            message: 'Invalid or expired session'
          }, 
          { status: 401 }
        );
      }
    }

    // Allow access to protected routes
    console.log('Middleware - Valid token, allowing access');
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware - Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    // For API routes, return 401 instead of redirecting
    if (path.startsWith('/api/')) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: errorMessage,
        code: 'AUTH_ERROR'
      }, { status: 401 });
    }
    
    // For non-API routes, redirect to login with error in searchParams
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', 'auth_required');
    loginUrl.searchParams.set('message', errorMessage);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure paths that should be protected
export const config = {
  matcher: [
    // Match all admin routes except login
    '/admin/((?!login$).*)',
    // Match all API routes except auth
    '/api/((?!auth/).*)',
  ],
}; 