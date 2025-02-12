const { MongoClient } = require('mongodb');
require('dotenv').config();

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

async function updateCategoryPalettes() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  const categories = db.collection('categories');

  console.log('Starting category palette update...');

  try {
    const categoryDocs = await categories.find({}).toArray();
    console.log('\nFound categories:');
    
    for (const category of categoryDocs) {
      const newPalette = getDefaultColorPalette(category.category);
      console.log(`Updating ${category.category}:`);
      console.log(`  Current palette: ${category.colorPalette}`);
      console.log(`  New palette: ${newPalette}`);
      
      await categories.updateOne(
        { _id: category._id },
        { 
          $set: { 
            colorPalette: newPalette,
            updatedAt: new Date()
          } 
        }
      );
      console.log(`  ✅ Updated successfully\n`);
    }

    // Verify the updates
    console.log('Verifying updates...');
    const updatedCategories = await categories.find({}).toArray();
    updatedCategories.forEach(cat => {
      console.log(`- ${cat.category}: ${cat.colorPalette}`);
    });

    console.log('\nCategory palettes updated successfully!');
  } catch (error) {
    console.error('Error updating category palettes:', error);
  } finally {
    await client.close();
  }
}

updateCategoryPalettes().catch(console.error); 