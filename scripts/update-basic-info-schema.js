import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function updateBasicInfoSchema() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    if (!process.env.MONGODB_DB) {
      throw new Error('MONGODB_DB is not defined');
    }

    console.log('\n🔄 Starting Basic Info Schema Update...');
    console.log('=====================================');
    
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db(process.env.MONGODB_DB);
    
    // Get current basic info
    const basicInfo = await db.collection('basic_info').findOne({});
    console.log('\nCurrent basic info:', basicInfo);

    if (basicInfo) {
      // Ensure all required fields exist with current values
      const updatedInfo = {
        name: basicInfo.name || 'Mustafa Saifee',
        yearsOfExperience: basicInfo.yearsOfExperience || '3+',
        phone: basicInfo.phone || '+1 650 439 6380',
        email: basicInfo.email || 'msaifee@andrew.cmu.edu',
        updatedAt: new Date(),
        // Initialize profilePicture as null if it doesn't exist
        profilePicture: basicInfo.profilePicture || null
      };

      // Update the document with the new schema
      await db.collection('basic_info').updateOne(
        { _id: basicInfo._id },
        { $set: updatedInfo }
      );

      console.log('\nSchema updated successfully');
      
      // Verify the update
      const verifiedInfo = await db.collection('basic_info').findOne({});
      console.log('\nUpdated basic info:', verifiedInfo);
    } else {
      console.log('\nNo basic info found. Creating with new schema...');
      
      // Create new basic info with the correct schema
      const newBasicInfo = {
        name: 'Mustafa Saifee',
        yearsOfExperience: '3+',
        phone: '+1 650 439 6380',
        email: 'msaifee@andrew.cmu.edu',
        updatedAt: new Date(),
        profilePicture: null
      };

      await db.collection('basic_info').insertOne(newBasicInfo);
      console.log('\nCreated new basic info with correct schema');
      
      // Verify the creation
      const verifiedInfo = await db.collection('basic_info').findOne({});
      console.log('\nNew basic info:', verifiedInfo);
    }

    await client.close();
    console.log('\n✅ Schema update completed');
  } catch (error) {
    console.error('\n❌ Error during schema update:', error);
    process.exit(1);
  }
}

// Run the update
updateBasicInfoSchema(); 