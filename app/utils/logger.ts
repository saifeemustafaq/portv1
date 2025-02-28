import Log from '@/models/Log';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import type { LogLevel, LogCategory, LogDetails, LogData, LogMessage } from '@/app/types/logging';

type LoggerErrorDetails = Record<string, unknown>;

// Custom error classes for logger
class LoggerError extends Error {
  constructor(message: string, public details?: LoggerErrorDetails) {
    super(message);
    this.name = 'LoggerError';
  }
}

class LogWriteError extends LoggerError {
  constructor(message: string, details?: LoggerErrorDetails) {
    super(message, details);
    this.name = 'LogWriteError';
  }
}

class LogConnectionError extends LoggerError {
  constructor(message: string, details?: LoggerErrorDetails) {
    super(message, details);
    this.name = 'LogConnectionError';
  }
}

const isServer = () => {
  return typeof window === 'undefined';
};

const validateLogLevel = (level: string): level is LogLevel => {
  return ['error', 'warn', 'info', 'debug'].includes(level);
};

const validateLogCategory = (category: string): category is LogCategory => {
  return ['auth', 'mongodb', 'bootstrap', 'system', 'action', 'performance'].includes(category);
};

const validateLogData = (level: LogLevel, category: LogCategory, data: LogData) => {
  if (!data.message) {
    throw new LoggerError('Log message is required');
  }
  
  if (!validateLogLevel(level)) {
    throw new LoggerError(`Invalid log level: ${level}`);
  }
  
  if (!validateLogCategory(category)) {
    throw new LoggerError(`Invalid log category: ${category}`);
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function createLogWithRetry(
  level: LogLevel,
  category: LogCategory,
  data: LogData,
  retryCount = 0
): Promise<void> {
  try {
    // Validate log data
    validateLogData(level, category, data);

    // Ensure database connection
    try {
      await connectDB();
    } catch (error) {
      throw new LogConnectionError('Failed to connect to database', { error });
    }

    const logEntry = {
      timestamp: new Date(),
      level,
      category,
      message: data.message,
      details: data.details || {},
      userId: data.userId,
      username: data.username,
      ip: data.ip || 'unknown',
      userAgent: data.userAgent || 'unknown',
      path: data.path || 'unknown',
      method: data.method || 'unknown'
    };

    try {
      await Log.create(logEntry);
    } catch (error) {
      throw new LogWriteError('Failed to write log entry', { error, logEntry });
    }
  } catch (error) {
    // If we haven't exceeded max retries and it's a connection error, retry
    if (retryCount < MAX_RETRIES && error instanceof LogConnectionError) {
      await delay(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      return createLogWithRetry(level, category, data, retryCount + 1);
    }

    // If we're out of retries or it's not a connection error, fallback to console
    console.error(`Logger Error (${error instanceof Error ? error.name : 'Unknown'}):`);
    console.error(error);
    console.log(`[${level}][${category}] ${data.message}`, data.details || {});

    // Re-throw the error for the caller to handle
    throw error;
  }
}

async function createLog(
  level: LogLevel,
  category: LogCategory,
  data: LogData
) {
  if (!isServer()) {
    // On client side or edge runtime, just console log
    console.log(`[${level}][${category}] ${data.message}`, data.details || {});
    return;
  }

  await createLogWithRetry(level, category, data);
}

// Authentication logs
export async function logAuth(message: string, details?: LogDetails, requestInfo?: Partial<LogData>) {
  if (!isServer()) return;
  
  try {
    const session = await getServerSession();
    await createLog('info', 'auth', {
      message,
      details,
      userId: session?.user?.id,
      username: session?.user?.email,
      ...requestInfo
    });
  } catch (error) {
    // Don't throw from high-level logging functions
    console.error('Error in logAuth:', error);
  }
}

// User action logs
export async function logAction(message: string, details?: LogDetails, requestInfo?: Partial<LogData>) {
  if (!isServer()) return;

  try {
    const session = await getServerSession();
    await createLog('info', 'action', {
      message,
      details,
      userId: session?.user?.id,
      username: session?.user?.email,
      ...requestInfo
    });
  } catch (error) {
    console.error('Error in logAction:', error);
  }
}

// System logs
export async function logSystem(
  level: LogLevel,
  message: string,
  details?: LogDetails,
  requestInfo?: Partial<LogData>
) {
  if (!isServer()) return;

  try {
    await createLog(level, 'system', {
      message,
      details,
      ...requestInfo
    });
  } catch (error) {
    console.error('Error in logSystem:', error);
  }
}

// Error logs (can be used for any category)
export async function logError(
  category: LogCategory,
  message: string,
  error: Error,
  requestInfo?: Partial<LogData>
) {
  if (!isServer()) return;

  try {
    const session = await getServerSession();
    await createLog('error', category, {
      message,
      details: {
        error: error.message,
        stack: error.stack,
        name: error.name,
        ...(error instanceof LoggerError ? { additionalDetails: error.details } : {})
      },
      userId: session?.user?.id,
      username: session?.user?.email,
      ...requestInfo
    });
  } catch (error) {
    console.error('Error in logError:', error);
  }
}

class Logger {
  private formatError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return { error };
  }

  private log(level: LogLevel, category: LogCategory, message: string, details?: Record<string, unknown>) {
    const logMessage: LogMessage = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    };

    // In development, log to console with colors
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        error: '\x1b[31m', // red
        warn: '\x1b[33m',  // yellow
        info: '\x1b[36m',  // cyan
        debug: '\x1b[90m', // gray
      };
      const reset = '\x1b[0m';

      console.log(
        `${colors[level]}[${logMessage.timestamp}] [${level.toUpperCase()}] [${category}] ${message}${reset}`,
        details || ''
      );
    } else {
      // In production, log as JSON for better parsing
      console.log(JSON.stringify(logMessage));
    }
  }

  error(category: LogCategory, message: string, details?: { error?: unknown }) {
    this.log('error', category, message, {
      ...details,
      ...(details?.error ? { error: this.formatError(details.error) } : {}),
    });
  }

  warn(category: LogCategory, message: string, details?: Record<string, unknown>) {
    this.log('warn', category, message, details);
  }

  info(category: LogCategory, message: string, details?: Record<string, unknown>) {
    this.log('info', category, message, details);
  }

  debug(category: LogCategory, message: string, details?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', category, message, details);
    }
  }
}

export const logger = new Logger(); 
