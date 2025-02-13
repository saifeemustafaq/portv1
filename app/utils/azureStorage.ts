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

// Helper function to generate SAS URL for a blob
async function generateSasUrl(containerClient: ContainerClient, blobName: string): Promise<string> {
  try {
    console.log('Generating SAS URL for blob:', blobName);
    
    // Clean the blob name (remove any path or URL components)
    const cleanBlobName = blobName.split('/').pop() || blobName;
    console.log('Cleaned blob name:', cleanBlobName);
    
    const blobClient = containerClient.getBlobClient(cleanBlobName);
    console.log('Blob URL:', blobClient.url);
    
    // Get storage account name and key from connection string
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('Azure Storage Connection string not found');
    }
    
    const accountKey = connectionString.match(/AccountKey=([^;]*)/)?.[1];
    const accountName = connectionString.match(/AccountName=([^;]*)/)?.[1];
    
    if (!accountKey || !accountName) {
      throw new Error('Invalid Azure Storage Connection string format');
    }

    // Create SharedKeyCredential
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Create SAS token that's valid for 24 hours
    const startsOn = new Date();
    const expiresOn = new Date(new Date().valueOf() + 24 * 60 * 60 * 1000);
    
    const sasOptions = {
      containerName: containerClient.containerName,
      blobName: cleanBlobName,
      permissions: BlobSASPermissions.parse("r"), // Read only permission
      startsOn: startsOn,
      expiresOn: expiresOn,
      protocol: SASProtocol.Https
    };

    // Generate SAS token using SharedKeyCredential
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    const fullUrl = `${blobClient.url}?${sasToken}`;
    console.log('Generated full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    throw error;
  }
}

export async function uploadImage(file: Buffer, fileName: string): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  try {
    // Upload original image
    const originalBlobClient = originalsContainerClient.getBlockBlobClient(fileName);
    await originalBlobClient.upload(file, file.length);

    // Create and upload thumbnail
    const thumbnail = await sharp(file)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    const thumbnailBlobClient = thumbnailsContainerClient.getBlockBlobClient(fileName);
    await thumbnailBlobClient.upload(thumbnail, thumbnail.length);

    // Generate SAS URLs for both blobs
    return {
      originalUrl: await generateSasUrl(originalsContainerClient, fileName),
      thumbnailUrl: await generateSasUrl(thumbnailsContainerClient, fileName)
    };
  } catch (error) {
    console.error('Error uploading to Azure Storage:', error);
    throw new Error('Failed to upload image');
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
    console.log('Getting image URL for:', fileName, 'thumbnail:', thumbnail);
    const containerClient = thumbnail ? thumbnailsContainerClient : originalsContainerClient;
    return await generateSasUrl(containerClient, fileName);
  } catch (error) {
    console.error('Error in getImageUrl:', error);
    throw error;
  }
} 