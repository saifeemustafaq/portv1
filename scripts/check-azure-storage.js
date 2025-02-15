import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkAzureStorage() {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const thumbnailsContainer = process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER;

    if (!connectionString || !containerName || !thumbnailsContainer) {
      throw new Error('Missing required Azure Storage environment variables');
    }

    console.log('\n🔍 Checking Azure Storage...');
    console.log('=========================');

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // Check originals container
    const originalsContainerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`\n📁 Checking originals container (${containerName}):`);
    console.log('----------------------------------------');
    
    let originalsIter = originalsContainerClient.listBlobsFlat();
    for await (const blob of originalsIter) {
      if (blob.name.startsWith('profile/')) {
        console.log(`Found profile image: ${blob.name}`);
        console.log(`Last modified: ${blob.properties.lastModified}`);
        console.log('----------------------------------------');
      }
    }

    // Check thumbnails container
    const thumbnailsContainerClient = blobServiceClient.getContainerClient(thumbnailsContainer);
    console.log(`\n📁 Checking thumbnails container (${thumbnailsContainer}):`);
    console.log('----------------------------------------');
    
    let thumbnailsIter = thumbnailsContainerClient.listBlobsFlat();
    for await (const blob of thumbnailsIter) {
      if (blob.name.startsWith('profile/')) {
        console.log(`Found profile thumbnail: ${blob.name}`);
        console.log(`Last modified: ${blob.properties.lastModified}`);
        console.log('----------------------------------------');
      }
    }

    console.log('\n✅ Azure Storage check completed');
  } catch (error) {
    console.error('\n❌ Error checking Azure Storage:', error);
    process.exit(1);
  }
}

// Run the check
checkAzureStorage(); 