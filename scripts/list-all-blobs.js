import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listAllBlobs() {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const thumbnailsContainer = process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER;

    if (!connectionString || !containerName || !thumbnailsContainer) {
      throw new Error('Missing required Azure Storage environment variables');
    }

    console.log('\n📝 Listing All Blobs in Azure Storage...');
    console.log('=====================================');

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // List all blobs in originals container
    const originalsContainerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`\n📁 All blobs in originals container (${containerName}):`);
    console.log('----------------------------------------');
    
    let originalsIter = originalsContainerClient.listBlobsFlat();
    for await (const blob of originalsIter) {
      console.log(`Blob: ${blob.name}`);
      console.log(`Last modified: ${blob.properties.lastModified}`);
      console.log(`Size: ${blob.properties.contentLength} bytes`);
      console.log('----------------------------------------');
    }

    // List all blobs in thumbnails container
    const thumbnailsContainerClient = blobServiceClient.getContainerClient(thumbnailsContainer);
    console.log(`\n📁 All blobs in thumbnails container (${thumbnailsContainer}):`);
    console.log('----------------------------------------');
    
    let thumbnailsIter = thumbnailsContainerClient.listBlobsFlat();
    for await (const blob of thumbnailsIter) {
      console.log(`Blob: ${blob.name}`);
      console.log(`Last modified: ${blob.properties.lastModified}`);
      console.log(`Size: ${blob.properties.contentLength} bytes`);
      console.log('----------------------------------------');
    }

    console.log('\n✅ Blob listing completed');
  } catch (error) {
    console.error('\n❌ Error listing blobs:', error);
    process.exit(1);
  }
}

// Run the listing
listAllBlobs(); 