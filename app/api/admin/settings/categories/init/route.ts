import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { CategoryType } from '@/types/projects';
import Category from '@/models/Category';
import connectDB from '@/lib/db';

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

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    console.log('Starting category initialization...');
    
    // Create initial categories from config
    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
      const categoryType = category as CategoryType;
      const existingCategory = await Category.findOne({ category: categoryType });
      
      if (!existingCategory) {
        await Category.create({
          category: categoryType,
          title: config.title,
          description: config.description,
          enabled: true,
          colorPalette: getDefaultColorPalette(categoryType),
        });
        console.log(`Created category: ${category} with palette: ${getDefaultColorPalette(categoryType)}`);
      } else {
        // Update existing category with color palette if it doesn't have one
        if (!existingCategory.colorPalette) {
          await Category.findByIdAndUpdate(existingCategory._id, {
            $set: { colorPalette: getDefaultColorPalette(categoryType) }
          });
          console.log(`Updated category ${category} with palette: ${getDefaultColorPalette(categoryType)}`);
        } else {
          console.log(`Category ${category} already exists with palette: ${existingCategory.colorPalette}`);
        }
      }
    }

    return NextResponse.json({ 
      message: 'Categories initialized successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error initializing categories:', error);
    return NextResponse.json(
      { error: 'Failed to initialize categories' },
      { status: 500 }
    );
  }
} 