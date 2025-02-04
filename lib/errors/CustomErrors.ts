type ErrorDetails = Record<string, unknown>;

export class BaseError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: ErrorDetails) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, details?: ErrorDetails) {
    super(500, 'DATABASE_ERROR', message, details);
  }
}

export class FileSystemError extends BaseError {
  constructor(message: string, details?: ErrorDetails) {
    super(500, 'FILE_SYSTEM_ERROR', message, details);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string, details?: ErrorDetails) {
    super(502, 'EXTERNAL_SERVICE_ERROR', `${service}: ${message}`, details);
  }
} 