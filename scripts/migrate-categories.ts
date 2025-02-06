import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { CATEGORY_CONFIG } from '@/app/config/categories';

async function migrateCategories() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    console.log('Starting category migration...');
    
    // Create initial categories from config
    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
      const existingCategory = await Category.findOne({ category });
      
      if (!existingCategory) {
        await Category.create({
          category,
          title: config.title,
          description: config.description,
          enabled: true,
          color: '#000000', // Default color
        });
        console.log(`Created category: ${category}`);
      } else {
        console.log(`Category ${category} already exists`);
      }
    }

    console.log('Category migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during category migration:', error);
    process.exit(1);
  }
}

migrateCategories(); 
