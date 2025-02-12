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

export async function bootstrapCategories() {
  try {
    await connectDB();
    
    // Check if we need to initialize categories
    const existingCount = await Category.countDocuments();
    if (existingCount === 0) {
      console.log('No categories found. Initializing categories...');
      
      // Create initial categories from config
      for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
        const categoryType = category as CategoryType;
        await Category.create({
          category: categoryType,
          title: config.title,
          description: config.description,
          enabled: true,
          colorPalette: getDefaultColorPalette(categoryType),
        });
        console.log(`Created category: ${category}`);
      }
      console.log('Categories initialized successfully!');
    } else {
      console.log(`Categories already initialized (${existingCount} found)`);
    }
  } catch (error) {
    console.error('Error during bootstrap:', error);
    // Don't throw the error - we want the application to continue running
    // but log it for monitoring
  }
} 