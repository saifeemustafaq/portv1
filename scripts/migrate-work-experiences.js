import { MongoClient } from 'mongodb';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Azure Storage setup
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const thumbnailsContainer = process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER;

if (!connectionString || !containerName || !thumbnailsContainer) {
  console.error('Missing required Azure Storage environment variables:');
  console.error('AZURE_STORAGE_CONNECTION_STRING:', !!connectionString);
  console.error('AZURE_STORAGE_CONTAINER_NAME:', !!containerName);
  console.error('AZURE_STORAGE_THUMBNAILS_CONTAINER:', !!thumbnailsContainer);
  process.exit(1);
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const originalsContainerClient = blobServiceClient.getContainerClient(containerName);
const thumbnailsContainerClient = blobServiceClient.getContainerClient(thumbnailsContainer);

// Helper function to generate SAS URL for a blob
async function generateSasUrl(containerClient, blobName) {
  try {
    console.log('Generating SAS URL for blob:', blobName);
    
    const blobClient = containerClient.getBlobClient(blobName);
    console.log('Blob URL:', blobClient.url);
    
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

async function getImageUrl(fileName, thumbnail = false) {
  try {
    console.log('Getting image URL for:', fileName, 'thumbnail:', thumbnail);
    const containerClient = thumbnail ? thumbnailsContainerClient : originalsContainerClient;
    return await generateSasUrl(containerClient, fileName);
  } catch (error) {
    console.error('Error in getImageUrl:', error);
    throw error;
  }
}

/**
 * Migration script to update work experience records with full Azure URLs
 * 
 * Note on URL Expiration:
 * The SAS URLs generated here will expire after 24 hours (as configured in azureStorage.ts).
 * For production use, you should:
 * 1. Either implement a periodic job to refresh these URLs before they expire
 * 2. Or modify the frontend to call an API endpoint that generates fresh URLs when needed
 * 3. Or increase the SAS token duration in generateSasUrl() for longer validity
 */
async function migrateWorkExperiences() {
  try {
    // Verify MongoDB environment variables are loaded
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    if (!process.env.MONGODB_DB) {
      throw new Error('MONGODB_DB is not defined');
    }

    console.log('Starting work experience migration...');
    console.log('Environment variables loaded successfully');
    
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db(process.env.MONGODB_DB);
    
    // Get all work experiences
    const experiences = await db.collection('workexperiences').find({}).toArray();
    console.log(`Found ${experiences.length} work experiences to migrate`);
    
    // Update each experience
    for (const exp of experiences) {
      if (exp.companyLogo && typeof exp.companyLogo === 'string') {
        console.log(`\nMigrating company: ${exp.companyName}`);
        console.log(`Current logo path: ${exp.companyLogo}`);
        
        try {
          // Generate URLs for both original and thumbnail
          const originalUrl = await getImageUrl(exp.companyLogo, false);
          const thumbnailUrl = await getImageUrl(exp.companyLogo, true);
          
          // Update the document with new structure
          await db.collection('workexperiences').updateOne(
            { _id: exp._id },
            {
              $set: {
                companyLogo: {
                  relativePath: exp.companyLogo,
                  original: originalUrl,
                  thumbnail: thumbnailUrl
                }
              }
            }
          );
          
          console.log('Successfully migrated:', exp.companyName);
        } catch (error) {
          console.error(`Error migrating ${exp.companyName}:`, error);
        }
      }
    }

    await client.close();
    console.log('\nMigration completed');
    console.log('\nNote: The generated URLs will expire in 24 hours.');
    console.log('Make sure to implement a URL refresh mechanism or update your frontend to handle URL expiration.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
  process.exit(0);
}

// Run the migration
migrateWorkExperiences(); 