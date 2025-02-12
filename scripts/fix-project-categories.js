const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixProjectCategories() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  const categories = db.collection('categories');
  const projects = db.collection('projects');

  console.log('Starting project category fix...');

  try {
    // Get all categories
    const categoryDocs = await categories.find({}).toArray();
    console.log('\nCurrent categories in DB:');
    categoryDocs.forEach(cat => {
      console.log(`- ${cat.category}: ${cat._id}`);
    });

    // Create a map of category types to their new IDs
    const categoryTypeToId = {};
    categoryDocs.forEach(cat => {
      categoryTypeToId[cat.category] = cat._id;
    });

    // Get all projects
    const projectDocs = await projects.find({}).toArray();
    console.log(`\nFound ${projectDocs.length} projects to process`);

    // Update each project
    for (const project of projectDocs) {
      console.log(`\nProcessing project: ${project.title}`);
      console.log(`Current category ID: ${JSON.stringify(project.category)}`);

      // Find the old category document to get its type
      const oldCategoryId = project.category;
      
      // Find the matching category by looking up its type
      const matchingCategory = categoryDocs.find(cat => 
        cat._id.toString() === oldCategoryId.toString()
      );

      if (!matchingCategory) {
        console.log(`⚠️ No matching category found for project: ${project.title}`);
        continue;
      }

      const categoryType = matchingCategory.category;
      const newCategoryId = categoryTypeToId[categoryType];

      // Update the project with the new category ID
      try {
        await projects.updateOne(
          { _id: project._id },
          { 
            $set: { 
              category: new ObjectId(newCategoryId),
              updatedAt: new Date()
            } 
          }
        );
        console.log(`✅ Updated project: ${project.title} from category ${categoryType}`);
        console.log(`  Old ID: ${oldCategoryId}`);
        console.log(`  New ID: ${newCategoryId}`);
      } catch (error) {
        console.error(`❌ Error updating project ${project.title}:`, error);
      }
    }

    // Verify the updates
    console.log('\nVerifying updates...');
    const updatedProjects = await projects.find({}).toArray();
    updatedProjects.forEach(project => {
      console.log(`- ${project.title}: Category ID = ${project.category}`);
    });

    console.log('\nProject categories update completed!');
  } catch (error) {
    console.error('Error fixing project categories:', error);
  } finally {
    await client.close();
  }
}

fixProjectCategories().catch(console.error); 