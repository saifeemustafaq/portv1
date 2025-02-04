import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import type { JWT } from 'next-auth/jwt';

interface CustomJWT extends JWT {
  sessionId?: string;
  user?: {
    sessionId?: string;
    [key: string]: any;
  };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/admin/login';

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  }) as CustomJWT | null;

  // Redirect to login if trying to access a protected route without being authenticated
  if (!isPublicPath && (!token || !token.sessionId || !token.user?.sessionId || token.sessionId !== token.user.sessionId)) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Redirect to dashboard if trying to access login while already authenticated
  if (isPublicPath && token && token.sessionId && token.user?.sessionId && token.sessionId === token.user.sessionId) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure paths that should be protected
export const config = {
  matcher: ['/admin/:path*'],
}; 