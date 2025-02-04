import Log from '@/models/Log';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';

type LogLevel = 'info' | 'warn' | 'error';
type LogCategory = 'auth' | 'action' | 'system';

interface LogDetails {
  [key: string]: string | number | boolean | null | undefined;
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

const isServer = () => {
  return typeof window === 'undefined' && process.env.NEXT_RUNTIME === 'nodejs';
};

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

  try {
    // Ensure database connection is established
    await connectDB();

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

    await Log.create(logEntry);
  } catch (error) {
    // If logging fails, fallback to console
    console.error('Failed to create log entry:', error);
    console.log(`[${level}][${category}] ${data.message}`, data.details || {});
  }
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
        stack: error.stack
      },
      userId: session?.user?.id,
      username: session?.user?.email,
      ...requestInfo
    });
  } catch (error) {
    console.error('Error in logError:', error);
  }
} 
