import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function analyzeDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    if (!process.env.MONGODB_DB) {
      throw new Error('MONGODB_DB is not defined');
    }

    console.log('\n🔍 Starting Database Analysis...');
    console.log('=================================');
    
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db(process.env.MONGODB_DB);
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📚 Found ${collections.length} collections:`);
    console.log('=================================');
    
    // Analyze each collection
    for (const collection of collections) {
      console.log(`\n📑 Collection: ${collection.name}`);
      console.log('------------------------');
      
      const coll = db.collection(collection.name);
      
      // Get document count
      const count = await coll.countDocuments();
      console.log(`Documents count: ${count}`);
      
      if (count > 0) {
        // Get a sample document
        const sampleDoc = await coll.findOne();
        
        // Analyze schema structure
        console.log('\nSchema structure:');
        analyzeSchema(sampleDoc);
        
        // Show sample document
        console.log('\nSample document:');
        console.log(JSON.stringify(sampleDoc, null, 2));
        
        // Get indexes
        const indexes = await coll.indexes();
        console.log('\nIndexes:');
        console.log(JSON.stringify(indexes, null, 2));
      }
      
      console.log('\n------------------------');
    }

    await client.close();
    console.log('\n✅ Analysis completed');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

function analyzeSchema(doc, prefix = '') {
  if (!doc) return;
  
  Object.entries(doc).forEach(([key, value]) => {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    
    if (value === null) {
      console.log(`${fullPath}: null`);
    } else if (Array.isArray(value)) {
      console.log(`${fullPath}: Array`);
      if (value.length > 0) {
        analyzeSchema(value[0], `${fullPath}[0]`);
      }
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      console.log(`${fullPath}: Object`);
      analyzeSchema(value, fullPath);
    } else {
      console.log(`${fullPath}: ${value instanceof Date ? 'Date' : typeof value}`);
    }
  });
}

// Run the analysis
analyzeDatabase(); 