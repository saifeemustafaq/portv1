import { NextResponse } from 'next/server';
import { BaseError } from './CustomErrors';
import { formatError } from './errorFormatter';
import { logError } from '@/app/utils/logger';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

type RouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse;

export async function handleError(error: Error | BaseError) {
  const headersList = await headers();
  const requestId = headersList.get('x-request-id') || undefined;
  const path = headersList.get('x-invoke-path') || 'unknown';
  const method = headersList.get('x-invoke-method') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // Format the error response
  const errorResponse = formatError(error, requestId);

  // Log the error with additional request context
  await logError(
    'system',
    error instanceof BaseError ? error.code : 'INTERNAL_SERVER_ERROR',
    error,
    {
      path,
      method,
      userAgent,
      ip,
      details: {
        ...errorResponse,
        stack: error.stack
      }
    }
  );

  // Return formatted error response
  return NextResponse.json(
    errorResponse,
    { status: errorResponse.status }
  );
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, ...args: unknown[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleError(error instanceof Error ? error : new Error(String(error)));
    }
  };
} 
