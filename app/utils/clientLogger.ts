import type { LogLevel, LogCategory, LogDetails } from './logger';

// Generate a unique correlation ID for the session
const sessionCorrelationId = Math.random().toString(36).substring(2, 15);

// Console styling for different log levels
const consoleStyles = {
  error: 'background: #fee2e2; color: #dc2626; padding: 2px 4px; border-radius: 2px;',
  warn: 'background: #fef3c7; color: #d97706; padding: 2px 4px; border-radius: 2px;',
  info: 'background: #dbeafe; color: #2563eb; padding: 2px 4px; border-radius: 2px;',
  debug: 'background: #f3f4f6; color: #4b5563; padding: 2px 4px; border-radius: 2px;',
};

interface EnhancedLogDetails extends LogDetails {
  correlationId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

async function logToServer(
  level: LogLevel,
  category: LogCategory,
  message: string,
  details?: EnhancedLogDetails
) {
  const enhancedDetails = {
    ...details,
    correlationId: sessionCorrelationId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Console logging with styling
  const style = consoleStyles[level] || consoleStyles.debug;
  console.groupCollapsed(`%c${level.toUpperCase()} [${category}]`, style);
  console.log('Message:', message);
  console.log('Details:', enhancedDetails);
  if (details?.stack) console.log('Stack:', details.stack);
  console.groupEnd();

  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': sessionCorrelationId,
      },
      body: JSON.stringify({
        level,
        category,
        message,
        details: enhancedDetails,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log to server:', await response.text());
    }
  } catch (error) {
    console.error('Error logging to server:', error);
  }
}

export async function logClientError(
  category: LogCategory,
  message: string,
  error: Error
) {
  const errorDetails: EnhancedLogDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  await logToServer('error', category, message, errorDetails);
}

export async function logClientWarning(
  category: LogCategory,
  message: string,
  details?: LogDetails
) {
  await logToServer('warn', category, message, details);
}

export async function logClientInfo(
  category: LogCategory,
  message: string,
  details?: LogDetails
) {
  await logToServer('info', category, message, details);
}

export async function logClientAction(
  message: string,
  details?: LogDetails
) {
  await logToServer('info', 'action', message, details);
}

export async function logClientAuth(
  message: string,
  details?: LogDetails
) {
  await logToServer('info', 'auth', message, details);
}

// Add performance monitoring
export async function logClientPerformance(
  operation: string,
  duration: number,
  details?: LogDetails
) {
  await logToServer('info', 'performance', `Operation ${operation} took ${duration}ms`, {
    ...details,
    duration,
    operation,
  });
} 