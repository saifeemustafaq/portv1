import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { logError } from '@/app/utils/logger';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Category from '@/models/Category';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // First get category IDs for each category type
    const categories = await Category.find({
      category: { $in: ['product', 'software', 'content', 'innovation'] }
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.category] = cat._id;
      return acc;
    }, {} as Record<string, string>);

    // Get project counts by category, checking both string and ObjectId references
    const [products, software, content, innovation] = await Promise.all([
      Project.countDocuments({ 
        $or: [
          { category: 'product' },
          { category: categoryMap['product'] }
        ]
      }),
      Project.countDocuments({ 
        $or: [
          { category: 'software' },
          { category: categoryMap['software'] }
        ]
      }),
      Project.countDocuments({ 
        $or: [
          { category: 'content' },
          { category: categoryMap['content'] }
        ]
      }),
      Project.countDocuments({ 
        $or: [
          { category: 'innovation' },
          { category: categoryMap['innovation'] }
        ]
      })
    ]);

    return NextResponse.json({
      stats: {
        products,
        software,
        content,
        innovation
      }
    });
  } catch (error) {
    await logError('system', 'Failed to fetch dashboard stats', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 