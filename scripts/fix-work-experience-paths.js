import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixWorkExperiencePaths() {
  try {
    console.log('Starting work experience path fix...');
    
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db(process.env.MONGODB_DB);
    
    // Get all work experiences
    const experiences = await db.collection('workexperiences').find({}).toArray();
    console.log(`Found ${experiences.length} work experiences in MongoDB`);
    
    // Fix each experience's logo path
    for (const exp of experiences) {
      if (exp.companyLogo && !exp.companyLogo.startsWith('work-experiences/')) {
        const newPath = `work-experiences/${exp.companyLogo}`;
        console.log(`Updating ${exp.companyName} logo path from ${exp.companyLogo} to ${newPath}`);
        
        await db.collection('workexperiences').updateOne(
          { _id: exp._id },
          { $set: { companyLogo: newPath } }
        );
      }
    }

    await client.close();
    console.log('\nFix completed');
  } catch (error) {
    console.error('Error during fix:', error);
    process.exit(1);
  }
  process.exit(0);
}

fixWorkExperiencePaths(); 