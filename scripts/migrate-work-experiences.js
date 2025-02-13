import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrateWorkExperiences() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const testDb = client.db('test');
    const portfolioDb = client.db('portfolio');

    // Get all work experiences from test database
    const workExperiences = await testDb.collection('workexperiences').find({}).toArray();
    console.log(`Found ${workExperiences.length} work experiences in test database`);

    if (workExperiences.length > 0) {
      // Insert into portfolio database
      const result = await portfolioDb.collection('workexperiences').insertMany(workExperiences);
      console.log(`Successfully migrated ${result.insertedCount} work experiences to portfolio database`);

      // Optionally, delete from test database
      const deleteResult = await testDb.collection('workexperiences').deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} work experiences from test database`);
    } else {
      console.log('No work experiences found in test database');
    }

  } catch (error) {
    console.error('Error migrating work experiences:', error);
  } finally {
    await client.close();
  }
}

migrateWorkExperiences().catch(console.error); 