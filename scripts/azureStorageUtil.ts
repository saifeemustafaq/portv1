import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';

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
    
    const blobClient = containerClient.getBlobClient(blobName);
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
      blobName: blobName,
      permissions: BlobSASPermissions.parse("r"), // Read only permission
      startsOn: startsOn,
      expiresOn: expiresOn,
      protocol: SASProtocol.Https
    };

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    throw error;
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