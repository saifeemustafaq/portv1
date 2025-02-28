import { NextResponse } from 'next/server';
import { BaseError } from './CustomErrors';
import { formatError } from './errorFormatter';
import { logError } from '@/app/utils/logger';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

type RouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse;

interface ErrorContext {
  requestId: string;
  path: string;
  method: string;
  userAgent: string;
  ip: string;
  timestamp: string;
  correlationId?: string;
  referrer?: string;
}

async function getErrorContext(): Promise<ErrorContext> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  
  return {
    requestId: headersList.get('x-request-id') ?? generateRequestId(),
    path: headersList.get('x-invoke-path') ?? 'unknown',
    method: headersList.get('x-invoke-method') ?? 'unknown',
    userAgent: headersList.get('user-agent') ?? 'unknown',
    ip: forwardedFor ? forwardedFor.split(',')[0] : 'unknown',
    timestamp: new Date().toISOString(),
    correlationId: headersList.get('x-correlation-id') ?? undefined,
    referrer: headersList.get('referer') ?? undefined,
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function categorizeError(error: Error): {
  code: string;
  status: number;
  category: 'validation' | 'auth' | 'permission' | 'notFound' | 'server';
} {
  if (error instanceof BaseError) {
    return {
      code: error.code,
      status: error.status,
      category: 'server', // Default to server for BaseError
    };
  }

  // Default error categorization
  if (error.name === 'ValidationError') {
    return { code: 'VALIDATION_ERROR', status: 400, category: 'validation' };
  }
  if (error.name === 'UnauthorizedError') {
    return { code: 'UNAUTHORIZED', status: 401, category: 'auth' };
  }
  if (error.name === 'ForbiddenError') {
    return { code: 'FORBIDDEN', status: 403, category: 'permission' };
  }
  if (error.name === 'NotFoundError') {
    return { code: 'NOT_FOUND', status: 404, category: 'notFound' };
  }

  return { code: 'INTERNAL_SERVER_ERROR', status: 500, category: 'server' };
}

export async function handleError(error: Error | BaseError) {
  const context = await getErrorContext();
  const { code, status, category } = categorizeError(error);

  // Format the error response
  const errorResponse = formatError(error, context.requestId);

  // Add error context to the response
  const enhancedErrorResponse = {
    ...errorResponse,
    requestId: context.requestId,
    timestamp: context.timestamp,
  };

  // Log the error with additional context
  await logError(
    'system',
    `${category.toUpperCase()}_ERROR: ${code}`,
    error,
    {
      path: context.path,
      method: context.method,
      userAgent: context.userAgent,
      ip: context.ip,
      details: {
        ...enhancedErrorResponse,
        stack: error.stack,
        correlationId: context.correlationId,
        referrer: context.referrer,
      }
    }
  );

  // Return formatted error response
  return NextResponse.json(
    enhancedErrorResponse,
    { 
      status,
      headers: {
        'X-Request-ID': context.requestId,
        'X-Error-Code': code,
        ...(context.correlationId && { 'X-Correlation-ID': context.correlationId }),
      }
    }
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
