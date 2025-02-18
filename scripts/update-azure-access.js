import dotenv from 'dotenv';
import { BlobServiceClient } from '@azure/storage-blob';

dotenv.config();

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error('Azure Storage Connection string not found');
}

if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
  throw new Error('Azure Storage Container name not found');
}

if (!process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER) {
  throw new Error('Azure Storage Thumbnails Container name not found');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const originalsContainerClient = blobServiceClient.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER_NAME
);

const thumbnailsContainerClient = blobServiceClient.getContainerClient(
  process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER
);

async function updateContainerAccess() {
  try {
    // Create containers if they don't exist and set public access
    for (const containerClient of [originalsContainerClient, thumbnailsContainerClient]) {
      // First create if not exists
      await containerClient.createIfNotExists();
      
      // Then set the access policy to allow public access to blobs
      await containerClient.setAccessPolicy('blob');
      
      console.log(`Container ${containerClient.containerName} configured for public access`);
    }
    console.log('Successfully updated container access policies');
  } catch (error) {
    console.error('Failed to update container access:', error);
    throw error;
  }
}

// Run the update
updateContainerAccess().catch(console.error); 