import Log from '@/models/Log';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';

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

export type LogLevel = 'info' | 'warn' | 'error';
export type LogCategory = 'auth' | 'action' | 'system';

export interface LogDetails {
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}

interface LogData {
  message: string;
  details?: LogDetails;
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const isServer = () => {
  return typeof window === 'undefined' && process.env.NEXT_RUNTIME === 'nodejs';
};

const validateLogData = (level: LogLevel, category: LogCategory, data: LogData) => {
  if (!data.message) {
    throw new LoggerError('Log message is required');
  }
  if (!['info', 'warn', 'error'].includes(level)) {
    throw new LoggerError('Invalid log level', { level });
  }
  if (!['auth', 'action', 'system'].includes(category)) {
    throw new LoggerError('Invalid log category', { category });
  }
  if (data.details && typeof data.details !== 'object') {
    throw new LoggerError('Log details must be an object', { details: typeof data.details });
  }
};

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
