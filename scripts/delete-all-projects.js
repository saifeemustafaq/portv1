import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

async function main() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Explicitly specify the 'portfolio' database
    const db = client.db('portfolio');
    
    // Get count of projects
    const count = await db.collection('projects').countDocuments();
    console.log(`Found ${count} projects in the database`);
    
    if (count > 0) {
      // Delete all projects
      const result = await db.collection('projects').deleteMany({});
      console.log(`Deleted ${result.deletedCount} projects`);
    } else {
      console.log('No projects to delete');
    }
    
    await client.close();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 