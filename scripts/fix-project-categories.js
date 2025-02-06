require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define Category Schema
const categorySchema = new Schema({
  category: {
    type: String,
    enum: ['product', 'software', 'content', 'innovation'],
    required: true,
    unique: true,
  },
  title: String,
  description: String,
  enabled: Boolean,
  colorPalette: String
});

const Category = mongoose.model('Category', categorySchema);

// Define Project Schema
const projectSchema = new Schema({
  title: String,
  description: String,
  category: {
    type: Schema.Types.Mixed,
    ref: 'Category'
  },
  createdBy: Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
});

const Project = mongoose.model('Project', projectSchema);

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all projects
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects to process\n`);

    // Process each project
    for (const project of projects) {
      try {
        // If category is a string, find the corresponding category document
        if (typeof project.category === 'string') {
          console.log(`Processing project "${project.title}" with category "${project.category}"`);
          
          const categoryDoc = await Category.findOne({ category: project.category });
          if (categoryDoc) {
            // Update the project with the category ID
            await Project.findByIdAndUpdate(project._id, {
              category: categoryDoc._id
            });
            console.log(`✓ Updated project "${project.title}" with category ID\n`);
          } else {
            console.log(`✗ Category "${project.category}" not found for project "${project.title}"\n`);
          }
        } else {
          console.log(`• Project "${project.title}" already has a category ID\n`);
        }
      } catch (error) {
        console.error(`Error processing project ${project.title}:`, error);
      }
    }

    // Verify the fix
    const updatedProjects = await Project.find({}).populate('category');
    console.log('\nVerification:');
    updatedProjects.forEach(project => {
      console.log(`- ${project.title}: Category = ${project.category?.category || 'Not found'}`);
    });

  } catch (error) {
    console.error('\nError:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main(); 