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
import { handleError } from '@/lib/errors/errorMiddleware';
import { ValidationError, AuthorizationError, DatabaseError, BaseError } from '@/lib/errors/CustomErrors';

interface ExtendedCategoryConfig {
  title: string;
  description: string;
  category: CategoryType;
  enabled: boolean;
  colorPalette: string;
  _id: string;
}

interface _CategoryDocument extends Document {
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

// Validate category type
const validateCategoryType = (categoryType: string): categoryType is CategoryType => {
  return ['product', 'software', 'content', 'innovation'].includes(categoryType);
};

// Validate color palette
const validateColorPalette = (palette: string): boolean => {
  return COLOR_PALETTES.some(p => p.id === palette);
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      throw new AuthorizationError('Unauthorized access to category settings');
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
    
    // Use type assertion to handle the mongoose type issue
    const formattedCategories = categories.reduce((acc, cat) => {
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

    await logAction('Category settings retrieved', {
      userId: session.user?.email || 'unknown',
      categoriesCount: Object.keys(formattedCategories).length
    });

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    return handleError(error as Error | BaseError);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      throw new AuthorizationError('Unauthorized access to update category settings');
    }

    const body = await request.json();
    
    if (!body.categories) {
      throw new ValidationError('Categories data is required');
    }

    const { categories } = body as {
      categories: Record<string, ExtendedCategoryConfig>
    };

    // Validate categories data
    for (const [categoryKey, config] of Object.entries(categories)) {
      if (!validateCategoryType(categoryKey)) {
        throw new ValidationError(`Invalid category type: ${categoryKey}`);
      }
      
      if (config.colorPalette && !validateColorPalette(config.colorPalette)) {
        throw new ValidationError(`Invalid color palette for ${categoryKey}: ${config.colorPalette}`);
      }
      
      if (!config.title || config.title.trim() === '') {
        throw new ValidationError(`Title is required for category: ${categoryKey}`);
      }
    }

    await connectDB();

    // Update each category
    for (const [categoryKey, config] of Object.entries(categories)) {
      try {
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
      } catch (err) {
        throw new DatabaseError(`Failed to update category: ${categoryKey}`, { cause: err });
      }
    }

    await logAction('Category settings updated', {
      userId: session.user?.email || 'unknown',
      updatedCategories: Object.keys(categories).join(',')
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error as Error | BaseError);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      throw new AuthorizationError('Unauthorized access to update category');
    }

    await connectDB();
    const body = await request.json();
    
    if (!body.categoryType || !body.updates) {
      throw new ValidationError('Category type and updates are required');
    }
    
    const { categoryType, updates } = body;

    // Validate that this is a valid category type
    if (!validateCategoryType(categoryType)) {
      throw new ValidationError(`Invalid category type: ${categoryType}`);
    }

    // Validate color palette if it's being updated
    if (updates.colorPalette && !validateColorPalette(updates.colorPalette)) {
      throw new ValidationError(`Invalid color palette: ${updates.colorPalette}`);
    }

    // Validate title if it's being updated
    if (updates.title !== undefined && (!updates.title || updates.title.trim() === '')) {
      throw new ValidationError('Title cannot be empty');
    }

    try {
      const category = await Category.findOneAndUpdate(
        { category: categoryType },
        { $set: updates },
        { new: true }
      );

      if (!category) {
        throw new ValidationError(`Category not found: ${categoryType}`);
      }

      await logAction('Category updated', {
        userId: session.user?.email || 'unknown',
        categoryType,
        updatedFields: Object.keys(updates).join(',')
      });

      return NextResponse.json(category);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new DatabaseError(`Failed to update category: ${categoryType}`, { cause: err });
    }
  } catch (error) {
    return handleError(error as Error | BaseError);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      throw new AuthorizationError('Unauthorized access to delete projects');
    }

    const body = await request.json();
    
    if (!body.categoryType) {
      throw new ValidationError('Category type is required');
    }

    const { categoryType } = body;
    
    // Validate that this is a valid category type
    if (!validateCategoryType(categoryType)) {
      throw new ValidationError(`Invalid category type: ${categoryType}`);
    }

    // Connect to MongoDB
    await connectDB();

    // First, find the Category document to get its _id
    const categoryDoc = await Category.findOne({ category: categoryType });
    
    if (!categoryDoc) {
      throw new ValidationError(`Category not found: ${categoryType}`);
    }
    
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
          await logError('system', 'Delete project image error', error as Error);
          // Continue with project deletion even if image deletion fails
        }
      }
    });

    try {
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

      return NextResponse.json({ 
        message: 'Projects deleted successfully',
        deletedCount: result.deletedCount 
      });
    } catch (err) {
      throw new DatabaseError(`Failed to delete projects for category: ${categoryType}`, { cause: err });
    }
  } catch (error) {
    return handleError(error as Error | BaseError);
  }
} 