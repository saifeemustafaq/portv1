import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Log from '@/models/Log';
import { AuthenticationError, ValidationError, DatabaseError } from '@/lib/errors/CustomErrors';
import { withErrorHandler } from '@/lib/errors/errorMiddleware';
import { logError } from '@/app/utils/logger';

interface LogQuery {
  level?: string;
  category?: string;
  timestamp?: {
    $gte?: Date;
    $lte?: Date;
  };
}

async function handleGetLogs(request: Request) {
  const session = await getServerSession();
  if (!session) {
    throw new AuthenticationError('You must be logged in to access logs');
  }

  try {
    await connectDB();
  } catch (error) {
    throw new DatabaseError('Failed to connect to database', { error });
  }

  // Parse query parameters
  const url = new URL(request.url);
  const level = url.searchParams.get('level');
  const category = url.searchParams.get('category');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  // Validate pagination parameters
  if (isNaN(page) || page < 1) {
    throw new ValidationError('Invalid page number', { page });
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('Invalid limit. Must be between 1 and 100', { limit });
  }

  // Validate date parameters
  if (from && isNaN(Date.parse(from))) {
    throw new ValidationError('Invalid from date format', { from });
  }
  if (to && isNaN(Date.parse(to))) {
    throw new ValidationError('Invalid to date format', { to });
  }

  // Build query
  const query: LogQuery = {};
  if (level && level !== 'all') {
    if (!['error', 'info', 'warn', 'debug'].includes(level)) {
      throw new ValidationError('Invalid log level', { level });
    }
    query.level = level;
  }
  if (category && category !== 'all') {
    if (!['system', 'auth', 'project', 'admin'].includes(category)) {
      throw new ValidationError('Invalid log category', { category });
    }
    query.category = category;
  }
  if (from || to) {
    query.timestamp = {};
    if (from) {
      query.timestamp.$gte = new Date(from);
    }
    if (to) {
      query.timestamp.$lte = new Date(to);
    }
  }

  try {
    // Fetch logs with pagination
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(query)
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    await logError('system', 'Error fetching logs', error as Error);
    throw new DatabaseError('Failed to fetch logs', { error });
  }
}

export const GET = withErrorHandler(handleGetLogs); 