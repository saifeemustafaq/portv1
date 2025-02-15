import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkBasicInfo() {
  try {
    // Verify MongoDB environment variables are loaded
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    if (!process.env.MONGODB_DB) {
      throw new Error('MONGODB_DB is not defined');
    }

    console.log('Starting basic info check...');
    console.log('Environment variables loaded successfully');
    
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db(process.env.MONGODB_DB);
    
    // Get basic info
    const basicInfo = await db.collection('basic_info').findOne({});
    console.log('\nCurrent basic info:', basicInfo);

    if (!basicInfo) {
      console.log('\nNo basic info found. Creating default entry...');
      
      // Create default basic info
      const defaultBasicInfo = {
        name: 'Mustafa Saifee',
        yearsOfExperience: '3+',
        phone: '+1 650 439 6380',
        email: 'msaifee@andrew.cmu.edu',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('basic_info').insertOne(defaultBasicInfo);
      console.log('Default basic info created successfully');
    }

    // Get collections info
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:', collections.map(c => c.name));

    // Get basic info after potential creation
    const updatedBasicInfo = await db.collection('basic_info').findOne({});
    console.log('\nUpdated basic info:', updatedBasicInfo);

    await client.close();
    console.log('\nCheck completed');
  } catch (error) {
    console.error('Error during check:', error);
    process.exit(1);
  }
  process.exit(0);
}

// Run the check
checkBasicInfo(); 