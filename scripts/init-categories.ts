import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

import { CATEGORY_CONFIG } from '../app/config/categories';
import { CategoryType, CategoryConfig } from '../types/projects';
import Category from '../models/Category';
import connectDB from '../lib/db';

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

async function initCategories() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Starting category initialization...');
    
    // Create initial categories from config
    for (const [category, config] of Object.entries(CATEGORY_CONFIG) as [CategoryType, CategoryConfig][]) {
      const categoryType = category;
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

    console.log('Categories initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing categories:', error);
    process.exit(1);
  }
}

initCategories(); 