const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define Project Schema
const projectSchema = new Schema({
  title: String,
  description: String,
  category: String,
  createdBy: Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
});

// Create Project model
const Project = mongoose.model('Project', projectSchema);

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://saifeemustafaq:tFHKSbzioKhicgEP@cluster0.fzeio.mongodb.net/portfolio?retryWrites=true&w=majority&authSource=admin');
    console.log('Connected to MongoDB');

    // Find all projects
    const allProjects = await Project.find({});
    console.log('\nAll Projects:', JSON.stringify(allProjects, null, 2));

    // Find product category projects
    const productProjects = await Project.find({ category: 'product' });
    console.log('\nProduct Category Projects:', JSON.stringify(productProjects, null, 2));

    // Get count by category
    const categoryCounts = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\nProjects by Category:', JSON.stringify(categoryCounts, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main(); 