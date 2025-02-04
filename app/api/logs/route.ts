import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Log from '@/models/Log';

interface LogQuery {
  level?: string;
  category?: string;
  timestamp?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    // Parse query parameters
    const url = new URL(request.url);
    const level = url.searchParams.get('level');
    const category = url.searchParams.get('category');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build query
    const query: LogQuery = {};
    if (level && level !== 'all') {
      query.level = level;
    }
    if (category && category !== 'all') {
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
    console.error('Error fetching logs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 