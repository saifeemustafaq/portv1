import { MongoClient } from 'mongodb';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper function to generate SAS URL for a blob
async function generateSasUrl(containerClient, blobName) {
  try {
    console.log('Generating SAS URL for blob:', blobName);
    
    const blobClient = containerClient.getBlobClient(blobName);
    console.log('Blob URL:', blobClient.url);
    
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountKey = connectionString.match(/AccountKey=([^;]*)/)?.[1];
    const accountName = connectionString.match(/AccountName=([^;]*)/)?.[1];
    
    if (!accountKey || !accountName) {
      throw new Error('Invalid Azure Storage Connection string format');
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Create SAS token that's valid for 24 hours
    const startsOn = new Date();
    const expiresOn = new Date(new Date().valueOf() + 24 * 60 * 60 * 1000);
    
    const sasOptions = {
      containerName: containerClient.containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: startsOn,
      expiresOn: expiresOn,
      protocol: SASProtocol.Https
    };

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

async function fixProfilePicture() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    if (!process.env.MONGODB_DB) {
      throw new Error('MONGODB_DB is not defined');
    }
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not defined');
    }
    if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
      throw new Error('AZURE_STORAGE_CONTAINER_NAME is not defined');
    }
    if (!process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER) {
      throw new Error('AZURE_STORAGE_THUMBNAILS_CONTAINER is not defined');
    }

    console.log('\n🔄 Starting Profile Picture Fix...');
    console.log('=================================');
    
    // Connect to MongoDB and explicitly use the portfolio database
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('portfolio'); // Explicitly use 'portfolio' database
    
    // Log the current database being used
    console.log('\nUsing database:', await db.command({ dbStats: 1 }));
    
    // Connect to Azure Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const originalsContainerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);
    const thumbnailsContainerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_THUMBNAILS_CONTAINER);
    
    // Get current basic info
    const basicInfo = await db.collection('basic_info').findOne({});
    console.log('\nCurrent basic info:', basicInfo);

    if (!basicInfo) {
      console.log('\nNo basic info found in portfolio database. Creating new document...');
      // Create a new basic info document if it doesn't exist
      const defaultBasicInfo = {
        name: 'Mustafa Saifee',
        yearsOfExperience: '3+',
        phone: '+1 650 439 6380',
        email: 'msaifee@andrew.cmu.edu',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await db.collection('basic_info').insertOne(defaultBasicInfo);
      console.log('Created new basic info document:', insertResult);
      basicInfo = await db.collection('basic_info').findOne({ _id: insertResult.insertedId });
    }

    // Find the profile picture blob
    const profilePicName = 'profile-1739564759927-port prof pic.jpg';
    
    // Generate fresh SAS URLs for both original and thumbnail
    const originalUrl = await generateSasUrl(originalsContainerClient, profilePicName);
    const thumbnailUrl = await generateSasUrl(thumbnailsContainerClient, profilePicName);

    // Update the database with the profile picture information
    const updateResult = await db.collection('basic_info').updateOne(
      { _id: basicInfo._id },
      {
        $set: {
          profilePicture: {
            relativePath: profilePicName,
            original: originalUrl,
            thumbnail: thumbnailUrl
          },
          updatedAt: new Date()
        }
      }
    );

    console.log('\nDatabase update result:', updateResult);

    // Verify the update
    const updatedInfo = await db.collection('basic_info').findOne({ _id: basicInfo._id });
    console.log('\nUpdated basic info:', updatedInfo);

    await client.close();
    console.log('\n✅ Profile picture fix completed');
    
    console.log('\n📝 Next steps:');
    console.log('1. The profile picture is now properly referenced in the database');
    console.log('2. Fresh SAS URLs have been generated (valid for 24 hours)');
    console.log('3. Future updates through the UI will maintain this structure');
  } catch (error) {
    console.error('\n❌ Error fixing profile picture:', error);
    process.exit(1);
  }
}

// Run the fix
fixProfilePicture(); 