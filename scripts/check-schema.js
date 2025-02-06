import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function checkSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections:', collections.map(c => c.name));

    // Get Project collection schema
    const Project = mongoose.connection.collection('projects');
    const projectSample = await Project.findOne();
    console.log('\nProject Sample Document:');
    console.log(JSON.stringify(projectSample, null, 2));

    // Get Category collection schema
    const Category = mongoose.connection.collection('categories');
    const categorySample = await Category.findOne();
    console.log('\nCategory Sample Document:');
    console.log(JSON.stringify(categorySample, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema(); 