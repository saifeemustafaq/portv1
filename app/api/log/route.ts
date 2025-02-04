import { NextRequest, NextResponse } from 'next/server';
import { logAuth, logAction, logSystem } from '@/app/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, category, message, details } = body;

    // Get request information
    const requestInfo = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      path: request.nextUrl.pathname,
      method: request.method,
    };

    // Route to appropriate logging function
    switch (category) {
      case 'auth':
        await logAuth(message, details, requestInfo);
        break;
      case 'action':
        await logAction(message, details, requestInfo);
        break;
      case 'system':
        await logSystem(level, message, details, requestInfo);
        break;
      default:
        return NextResponse.json({ error: 'Invalid log category' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in log API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
