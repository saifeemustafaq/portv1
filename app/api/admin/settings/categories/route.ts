import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { CategoryType } from '@/types/projects';
import Category from '@/models/Category';
import connectDB from '@/lib/db';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';
import { Document } from 'mongoose';
import Project from '@/models/Project';
import { deleteImage } from '@/app/utils/azureStorage';
import { logAction, logError } from '@/app/utils/logger';

interface ExtendedCategoryConfig {
  title: string;
  description: string;
  category: CategoryType;
  enabled: boolean;
  colorPalette: string;
  _id: string;
}

interface CategoryDocument extends Document {
  title: string;
  description: string;
  category: CategoryType;
  enabled: boolean;
  colorPalette: string;
}

const getDefaultColorPalette = (categoryType: CategoryType): string => {
  switch(categoryType) {
    case 'product':
      return 'forest-haven';
    case 'software':
      return 'sunset-glow';
    case 'content':
      return 'royal-purple';
    case 'innovation':
      return 'cherry-blossom';
    default:
      return 'ocean-depths';
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const categories = await Category.find({}).lean();
    
    // If no categories exist, return default categories from config
    if (!categories || categories.length === 0) {
      const defaultCategories = Object.entries(CATEGORY_CONFIG).reduce((acc, [key, value]) => {
        const categoryType = key as CategoryType;
        acc[categoryType] = {
          ...value,
          enabled: true,
          colorPalette: getDefaultColorPalette(categoryType),
          _id: '',
        };
        return acc;
      }, {} as Record<CategoryType, ExtendedCategoryConfig>);

      return NextResponse.json({ categories: defaultCategories });
    }
    
    const formattedCategories = categories.reduce((acc, cat: CategoryDocument) => {
      if (cat && cat.category) {
        const categoryType = cat.category as CategoryType;
        acc[categoryType] = {
          title: cat.title || '',
          description: cat.description || '',
          category: categoryType,
          enabled: !!cat.enabled,
          colorPalette: cat.colorPalette || getDefaultColorPalette(categoryType),
          _id: cat._id?.toString() || '',
        };
      }
      return acc;
    }, {} as Record<CategoryType, ExtendedCategoryConfig>);

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Error fetching category settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categories } = await request.json() as {
      categories: Record<CategoryType, ExtendedCategoryConfig>
    };

    await connectDB();

    // Update each category
    for (const [categoryKey, config] of Object.entries(categories)) {
      await Category.findOneAndUpdate(
        { category: categoryKey },
        {
          $set: {
            title: config.title,
            description: config.description,
            enabled: config.enabled,
            colorPalette: config.colorPalette,
          }
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving category settings:', error);
    return NextResponse.json(
      { error: 'Failed to save category settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { categoryType, updates } = await request.json();
    console.log('PATCH Request:', { categoryType, updates });

    // Validate that this is a valid category type
    if (!['product', 'software', 'content', 'innovation'].includes(categoryType)) {
      console.log('Invalid category type:', categoryType);
      return NextResponse.json(
        { error: 'Invalid category type' },
        { status: 400 }
      );
    }

    // Validate color palette if it's being updated
    if (updates.colorPalette) {
      const validPalette = COLOR_PALETTES.find(p => p.id === updates.colorPalette);
      console.log('Color Palette Validation:', {
        requestedPalette: updates.colorPalette,
        valid: !!validPalette,
        availablePalettes: COLOR_PALETTES.map(p => p.id)
      });

      if (!validPalette) {
        return NextResponse.json(
          { error: 'Invalid color palette selected' },
          { status: 400 }
        );
      }
    }

    const category = await Category.findOneAndUpdate(
      { category: categoryType },
      { $set: updates },
      { new: true }
    );

    console.log('Updated Category:', {
      categoryType,
      updates,
      result: category
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { categoryType } = await request.json();
    
    if (!categoryType) {
      return Response.json({ error: 'Category type is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectDB();

    // First, find the Category document to get its _id
    const categoryDoc = await Category.findOne({ category: categoryType });
    
    // Find all projects that match the category
    const projects = await Project.find({
      $or: [
        { category: categoryType },  // Match string category
        { category: categoryDoc?._id }  // Match ObjectId category
      ]
    });

    // Delete images from Azure storage
    const deletePromises = projects.map(async (project) => {
      if (project.image && typeof project.image === 'object') {
        try {
          // Extract filename from URL
          const fileName = project.image.original.split('/').pop()?.split('?')[0];
          if (fileName) {
            await deleteImage(fileName);
          }
        } catch (error) {
          console.error('Failed to delete image from Azure:', error);
          await logError('system', 'Delete project image error', error as Error);
          // Continue with project deletion even if image deletion fails
        }
      }
    });

    // Wait for all image deletions to complete
    await Promise.all(deletePromises);

    // Delete the projects
    const result = await Project.deleteMany({
      $or: [
        { category: categoryType },
        { category: categoryDoc?._id }
      ]
    });

    await logAction('Projects deleted', {
      category: categoryType,
      count: result.deletedCount,
      deletedBy: session.user.email
    });

    return Response.json({ 
      message: 'Projects deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting projects:', error);
    await logError('system', 'Delete projects error', error as Error);
    return Response.json({ error: 'Failed to delete projects' }, { status: 500 });
  }
} 