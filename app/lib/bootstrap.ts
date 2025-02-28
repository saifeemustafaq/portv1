import { CATEGORY_CONFIG } from '@/app/config/categories';
import { CategoryType } from '@/types/projects';
import Category from '@/models/Category';
import connectDB from '@/lib/db';
import { logger } from '@/app/utils/logger';

interface CategoryConfig {
  title: string;
  description: string;
}

const getDefaultColorPalette = (categoryType: CategoryType): string => {
  const validTypes = ['product', 'software', 'content', 'innovation'] as const;
  if (!validTypes.includes(categoryType)) {
    throw new Error(`Invalid category type: ${categoryType}`);
  }

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

async function validateCategory(categoryType: CategoryType, config: CategoryConfig) {
  if (!config.title || typeof config.title !== 'string') {
    throw new Error(`Invalid title for category ${categoryType}`);
  }
  if (!config.description || typeof config.description !== 'string') {
    throw new Error(`Invalid description for category ${categoryType}`);
  }
}

export async function bootstrapCategories() {
  try {
    await connectDB();
    logger.info('bootstrap', 'Starting category initialization check');
    
    // Check if we need to initialize categories
    const existingCount = await Category.countDocuments();
    if (existingCount === 0) {
      logger.info('bootstrap', 'No categories found. Beginning initialization...');
      
      // Create initial categories from config
      for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
        const categoryType = category as CategoryType;
        
        try {
          // Validate category configuration
          await validateCategory(categoryType, config);
          
          // Get color palette with validation
          const colorPalette = getDefaultColorPalette(categoryType);
          
          // Create category
          await Category.create({
            category: categoryType,
            title: config.title,
            description: config.description,
            enabled: true,
            colorPalette,
          });
          
          logger.info('bootstrap', `Created category: ${category}`);
        } catch (categoryError) {
          logger.error('bootstrap', `Failed to create category ${category}`, { error: categoryError });
          throw categoryError; // Propagate error to prevent partial initialization
        }
      }
      
      logger.info('bootstrap', 'Categories initialized successfully!');
    } else {
      logger.info('bootstrap', `Categories already initialized (${existingCount} found)`);
    }
  } catch (error) {
    logger.error('bootstrap', 'Critical error during bootstrap', { error });
    throw error; // Propagate error for handling by caller
  }
} 