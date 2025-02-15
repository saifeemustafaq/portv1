import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

async function updateContainerAccess() {
  try {
    // Load environment variables
    dotenv.config();

    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('Azure Storage Connection string not found');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    // Get container clients
    const originalsContainerClient = blobServiceClient.getContainerClient('originals');
    const thumbnailsContainerClient = blobServiceClient.getContainerClient('thumbnails');

    // Set public access for both containers
    console.log('Setting public access for originals container...');
    await originalsContainerClient.setAccessPolicy('blob');
    
    console.log('Setting public access for thumbnails container...');
    await thumbnailsContainerClient.setAccessPolicy('blob');

    console.log('Successfully updated container access policies');
  } catch (error) {
    console.error('Error updating container access:', error);
    process.exit(1);
  }
}

// Run the update
updateContainerAccess(); 