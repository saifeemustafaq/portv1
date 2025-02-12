const { MongoClient } = require('mongodb');
require('dotenv').config();

const CATEGORY_CONFIG = {
  product: {
    title: 'Product Projects',
    description: 'Manage your product portfolio projects',
    category: 'product'
  },
  software: {
    title: 'Software Projects',
    description: 'Manage your software development projects',
    category: 'software'
  },
  content: {
    title: 'Content Projects',
    description: 'Manage your content and media projects',
    category: 'content'
  },
  innovation: {
    title: 'Innovation Projects',
    description: 'Manage your innovation and research projects',
    category: 'innovation'
  }
};

const getDefaultColorPalette = (categoryType) => {
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
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  const categories = db.collection('categories');

  console.log('Starting category initialization...');

  try {
    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
      const existingCategory = await categories.findOne({ category });
      
      if (!existingCategory) {
        await categories.insertOne({
          category,
          title: config.title,
          description: config.description,
          enabled: true,
          colorPalette: getDefaultColorPalette(category),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created category: ${category} with palette: ${getDefaultColorPalette(category)}`);
      } else {
        if (!existingCategory.colorPalette) {
          await categories.updateOne(
            { _id: existingCategory._id },
            { 
              $set: { 
                colorPalette: getDefaultColorPalette(category),
                updatedAt: new Date()
              } 
            }
          );
          console.log(`Updated category ${category} with palette: ${getDefaultColorPalette(category)}`);
        } else {
          console.log(`Category ${category} already exists with palette: ${existingCategory.colorPalette}`);
        }
      }
    }

    console.log('Categories initialized successfully!');
  } catch (error) {
    console.error('Error initializing categories:', error);
  } finally {
    await client.close();
  }
}

initCategories().catch(console.error); 