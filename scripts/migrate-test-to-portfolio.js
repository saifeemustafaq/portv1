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
    
    // Connect to both databases
    const testDb = client.db('test');
    const portfolioDb = client.db('portfolio');
    
    // Get all collections from test database
    const collections = await testDb.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\nProcessing collection: ${collectionName}`);
      
      // Get all documents from test collection
      const docs = await testDb.collection(collectionName).find({}).toArray();
      console.log(`Found ${docs.length} documents in test.${collectionName}`);
      
      if (docs.length > 0) {
        // Check if documents already exist in portfolio
        const existingCount = await portfolioDb.collection(collectionName).countDocuments();
        console.log(`Found ${existingCount} existing documents in portfolio.${collectionName}`);
        
        // Insert documents into portfolio database
        try {
          const result = await portfolioDb.collection(collectionName).insertMany(docs, { ordered: false });
          console.log(`Successfully migrated ${result.insertedCount} documents to portfolio.${collectionName}`);
        } catch (error) {
          if (error.code === 11000) {
            console.log(`Some documents were already present in portfolio.${collectionName} (duplicate key error)`);
          } else {
            throw error;
          }
        }
      }
      
      // Verify counts after migration
      const finalCount = await portfolioDb.collection(collectionName).countDocuments();
      console.log(`Final count in portfolio.${collectionName}: ${finalCount}`);
    }
    
    console.log('\nMigration completed successfully');
    await client.close();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 