import { BaseError } from './CustomErrors';

type ErrorDetails = Record<string, unknown>;

export class InvalidCredentialsError extends BaseError {
  constructor(message = 'Invalid credentials', details?: ErrorDetails) {
    super(401, 'INVALID_CREDENTIALS', message, details);
  }
}

export class SessionError extends BaseError {
  constructor(message = 'Session error', details?: ErrorDetails) {
    super(401, 'SESSION_ERROR', message, details);
  }
}

export class TokenError extends BaseError {
  constructor(message = 'Token error', details?: ErrorDetails) {
    super(401, 'TOKEN_ERROR', message, details);
  }
}

export class AuthConfigError extends BaseError {
  constructor(message = 'Authentication configuration error', details?: ErrorDetails) {
    super(500, 'AUTH_CONFIG_ERROR', message, details);
  }
}

export class MissingCredentialsError extends BaseError {
  constructor(details?: ErrorDetails) {
    super(400, 'MISSING_CREDENTIALS', 'Please enter both username and password', details);
  }
} 
