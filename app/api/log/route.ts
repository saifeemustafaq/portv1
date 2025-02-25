import { NextRequest, NextResponse } from 'next/server';
import { logAuth, logAction, logSystem } from '@/app/utils/logger';

// Simple in-memory rate limiting
const RATE_LIMIT = 100; // Max logs per minute per IP
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

// Valid log levels
const validLogLevels = ['error', 'warn', 'info', 'debug'];

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get correlation ID from headers or generate one
    const correlationId = request.headers.get('x-correlation-id') || 
                          `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          correlationId
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const { level, category, message, details } = body;
    
    if (!category || !message) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: category and message are required',
          correlationId
        },
        { status: 400 }
      );
    }

    // Validate log level if provided
    if (level && !validLogLevels.includes(level)) {
      return NextResponse.json(
        { 
          error: `Invalid log level. Must be one of: ${validLogLevels.join(', ')}`,
          correlationId
        },
        { status: 400 }
      );
    }

    // Get request information
    const requestInfo = {
      ip: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      path: request.nextUrl.pathname,
      method: request.method,
      correlationId
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
        return NextResponse.json(
          { 
            error: 'Invalid log category. Must be one of: auth, action, system',
            correlationId
          },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      correlationId
    });
  } catch (error) {
    const correlationId = request.headers.get('x-correlation-id') || 
                          `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Log the error on the server side
    console.error(`Error in log API route [${correlationId}]:`, error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        correlationId,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Rate limiting function
function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const minute = Math.floor(now / 60000); // Current minute timestamp
  const key = `${clientIp}:${minute}`;
  
  const current = rateLimitMap.get(key) || { count: 0, timestamp: now };
  
  // Reset if it's a new minute
  if (current.timestamp < now - 60000) {
    current.count = 0;
    current.timestamp = now;
  }
  
  current.count++;
  rateLimitMap.set(key, current);
  
  // Clean up old entries every 100 requests
  if (rateLimitMap.size > 100) {
    const cutoff = now - 120000; // 2 minutes ago
    Array.from(rateLimitMap.entries()).forEach(([mapKey, value]) => {
      if (value.timestamp < cutoff) {
        rateLimitMap.delete(mapKey);
      }
    });
  }
  
  return current.count > RATE_LIMIT;
} 
