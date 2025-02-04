import { BaseError } from './CustomErrors';

export interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export function formatError(error: Error | BaseError, requestId?: string): ErrorResponse {
  if (error instanceof BaseError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  // Handle unknown errors
  return {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    timestamp: new Date().toISOString(),
    requestId
  };
}

export function formatValidationErrors(errors: Record<string, string[]>): ErrorResponse {
  return {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: errors,
    timestamp: new Date().toISOString()
  };
} 