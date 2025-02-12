import connectDB from '../app/lib/mongodb';
import Project from '../models/Project';

async function checkProjectData() {
  try {
    await connectDB();
    
    // Get sample projects
    const projects = await Project.find({}).limit(5);
    console.log('Sample Projects:', JSON.stringify(projects, null, 2));
    
    // Count projects by category type
    const categoryCounts = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Projects by Category:', JSON.stringify(categoryCounts, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkProjectData(); 