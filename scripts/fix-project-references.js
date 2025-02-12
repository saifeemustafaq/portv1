const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixProjectReferences() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  const categories = db.collection('categories');
  const projects = db.collection('projects');

  console.log('Starting project reference fix...');

  try {
    // Get all categories
    const categoryDocs = await categories.find({}).toArray();
    console.log('\nFound categories:');
    categoryDocs.forEach(cat => {
      console.log(`- ${cat.category}: ${cat._id}`);
    });

    // Create a map of category strings to their IDs
    const categoryMap = {};
    categoryDocs.forEach(cat => {
      categoryMap[cat.category] = cat._id;
    });

    // Get all projects
    const projectDocs = await projects.find({}).toArray();
    console.log(`\nFound ${projectDocs.length} projects to process`);

    // Update each project
    for (const project of projectDocs) {
      console.log(`\nProcessing project: ${project.title}`);
      
      let categoryId = project.category;
      let needsUpdate = false;
      let matchingCategory = null;

      // Convert categoryId to string for comparison
      const categoryIdString = categoryId instanceof ObjectId 
        ? categoryId.toString() 
        : (categoryId && categoryId.$oid) 
          ? categoryId.$oid 
          : typeof categoryId === 'string' 
            ? categoryId 
            : null;

      console.log('Category ID String:', categoryIdString);

      // First try to match by ObjectId
      if (categoryIdString) {
        matchingCategory = categoryDocs.find(cat => 
          cat._id.toString() === categoryIdString
        );
      }

      // If no match found and it's a string, try to match by category name
      if (!matchingCategory && typeof categoryId === 'string') {
        matchingCategory = categoryDocs.find(cat => 
          cat.category === categoryId
        );
      }

      if (!matchingCategory) {
        // Try to infer category from existing ID mapping
        const existingCategory = categoryDocs.find(cat => 
          cat._id.toString() === categoryIdString
        );
        
        if (existingCategory) {
          matchingCategory = existingCategory;
          needsUpdate = true;
        } else {
          console.log(`⚠️ No matching category found for project: ${project.title}`);
          console.log(`Current category value:`, categoryId);
          continue;
        }
      }

      // Always update to ensure consistent format
      try {
        const newCategoryId = new ObjectId(matchingCategory._id);
        await projects.updateOne(
          { _id: new ObjectId(project._id) },
          { 
            $set: { 
              category: newCategoryId,
              updatedAt: new Date()
            } 
          }
        );
        console.log(`✅ Updated project: ${project.title}`);
        console.log(`  Category: ${matchingCategory.category}`);
        console.log(`  ID: ${newCategoryId}`);
      } catch (error) {
        console.error(`❌ Error updating project ${project.title}:`, error);
      }
    }

    // Verify the updates
    console.log('\nVerifying updates...');
    const updatedProjects = await projects.find({}).toArray();
    updatedProjects.forEach(project => {
      const category = categoryDocs.find(cat => 
        cat._id.toString() === project.category.toString()
      );
      console.log(`- ${project.title}: Category = ${category ? category.category : 'Unknown'} (${project.category})`);
    });

    console.log('\nProject references update completed!');
  } catch (error) {
    console.error('Error fixing project references:', error);
  } finally {
    await client.close();
  }
}

fixProjectReferences().catch(console.error); 