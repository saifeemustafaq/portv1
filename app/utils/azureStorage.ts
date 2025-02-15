'use server';

import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';
import sharp from 'sharp';

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

// Ensure containers are configured for public access
async function ensurePublicContainers() {
  try {
    // Create containers if they don't exist and set public access
    for (const containerClient of [originalsContainerClient, thumbnailsContainerClient]) {
      // First create if not exists
      await containerClient.createIfNotExists();
      
      // Then set the access policy to allow public access to blobs
      await containerClient.setAccessPolicy('blob');
      
      console.log(`Container ${containerClient.containerName} configured for public access`);
    }
  } catch (error) {
    console.error('Error configuring containers:', error);
    throw error;
  }
}

// Call this function to update container access
export async function updateContainerAccess(): Promise<void> {
  try {
    await ensurePublicContainers();
    console.log('Successfully updated container access policies');
  } catch (error) {
    console.error('Failed to update container access:', error);
    throw error;
  }
}

// Helper function to generate permanent URL for a blob
function generatePermanentUrl(containerClient: ContainerClient, blobName: string): string {
  const blobClient = containerClient.getBlobClient(blobName);
  return blobClient.url;
}

export async function uploadImage(file: Buffer | Uint8Array | string, fileName: string): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  try {
    // Convert input to Buffer if needed
    const fileBuffer = Buffer.isBuffer(file) ? file : 
                      file instanceof Uint8Array ? Buffer.from(file) :
                      Buffer.from(file, 'base64');

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Invalid file data provided');
    }

    // Upload original image
    const originalBlobClient = originalsContainerClient.getBlockBlobClient(fileName);
    await originalBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg'
      }
    });

    // Create and upload thumbnail
    const thumbnail = await sharp(fileBuffer)
      .resize(400, 300, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    const thumbnailBlobClient = thumbnailsContainerClient.getBlockBlobClient(fileName);
    await thumbnailBlobClient.uploadData(thumbnail, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg'
      }
    });

    // Generate permanent URLs for both blobs
    return {
      originalUrl: generatePermanentUrl(originalsContainerClient, fileName),
      thumbnailUrl: generatePermanentUrl(thumbnailsContainerClient, fileName)
    };
  } catch (error) {
    console.error('Error uploading to Azure Storage:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
}

export async function deleteImage(fileName: string): Promise<void> {
  try {
    // Delete both original and thumbnail
    const originalBlobClient = originalsContainerClient.getBlockBlobClient(fileName);
    const thumbnailBlobClient = thumbnailsContainerClient.getBlockBlobClient(fileName);

    await Promise.all([
      originalBlobClient.delete(),
      thumbnailBlobClient.delete()
    ]);
  } catch (error) {
    console.error('Error deleting from Azure Storage:', error);
    throw new Error('Failed to delete image');
  }
}

export async function getImageUrl(fileName: string, thumbnail: boolean = false): Promise<string> {
  try {
    const containerClient = thumbnail ? thumbnailsContainerClient : originalsContainerClient;
    return generatePermanentUrl(containerClient, fileName);
  } catch (error) {
    console.error('Error in getImageUrl:', error);
    throw error;
  }
}

export async function listBlobs(thumbnail: boolean = false): Promise<string[]> {
  try {
    const containerClient = thumbnail ? thumbnailsContainerClient : originalsContainerClient;
    const blobs: string[] = [];
    
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }
    
    return blobs;
  } catch (error) {
    console.error('Error listing blobs:', error);
    throw error;
  }
} 