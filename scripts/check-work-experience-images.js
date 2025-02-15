import { MongoClient } from 'mongodb';
import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkWorkExperienceImages() {
  try {
    console.log('Starting work experience image check...');
    
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db(process.env.MONGODB_DB);
    
    // Get all work experiences
    const experiences = await db.collection('workexperiences').find({}).toArray();
    console.log(`Found ${experiences.length} work experiences in MongoDB`);
    
    // List all experiences and their logo paths
    for (const exp of experiences) {
      console.log(`\nCompany: ${exp.companyName}`);
      console.log(`Logo path: ${exp.companyLogo || 'No logo'}`);
    }

    // Connect to Azure Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    // Check both containers
    const containers = [
      process.env.AZURE_STORAGE_CONTAINER_NAME,
      process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER
    ];

    for (const containerName of containers) {
      console.log(`\nChecking container: ${containerName}`);
      const containerClient = blobServiceClient.getContainerClient(containerName);
      
      const blobs = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        blobs.push(blob.name);
      }
      
      console.log(`Found ${blobs.length} blobs in container`);
      console.log('Blob names:', blobs);

      // Check if each experience's logo exists in this container
      for (const exp of experiences) {
        if (exp.companyLogo) {
          const exists = blobs.includes(exp.companyLogo);
          console.log(`${exp.companyName} logo (${exp.companyLogo}): ${exists ? 'EXISTS' : 'MISSING'}`);
        }
      }
    }

    await client.close();
    console.log('\nCheck completed');
  } catch (error) {
    console.error('Error during check:', error);
    process.exit(1);
  }
  process.exit(0);
}

checkWorkExperienceImages(); 