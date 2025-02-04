import Log from '@/models/Log';
import { getSession } from 'next-auth/react';
import connectDB from '@/lib/db';

type LogLevel = 'info' | 'warn' | 'error';
type LogCategory = 'auth' | 'action' | 'system';

interface LogData {
  message: string;
  details?: any;
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

async function createLog(
  level: LogLevel,
  category: LogCategory,
  data: LogData
) {
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
    // Don't throw the error to prevent breaking the application flow
    console.error('Error creating log:', error);
  }
}

// Authentication logs
export async function logAuth(message: string, details?: any, requestInfo?: Partial<LogData>) {
  try {
    const session = await getSession();
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
export async function logAction(message: string, details?: any, requestInfo?: Partial<LogData>) {
  try {
    const session = await getSession();
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
  details?: any,
  requestInfo?: Partial<LogData>
) {
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
  error: any,
  requestInfo?: Partial<LogData>
) {
  try {
    const session = await getSession();
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
