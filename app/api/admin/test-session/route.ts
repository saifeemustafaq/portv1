import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    isAuthenticated: !!session,
    session: session,
    cookies: request.cookies.getAll(),
  });
} 