import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { BlobServiceClient } from '@azure/storage-blob';

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING is required');
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

// Helper function to get direct URL
function getDirectUrl(containerClient, blobName) {
  const blobClient = containerClient.getBlobClient(blobName);
  return blobClient.url;
}

// Helper function to extract blob name from URL
function extractBlobName(url) {
  try {
    // Extract the filename from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Get the last part of the path (the filename)
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error('Error extracting blob name from URL:', url);
    throw error;
  }
}

async function updateImageUrls() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Use portfolio database explicitly
    const db = client.db('portfolio');
    console.log('Using database: portfolio');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));

    // Update Projects
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`Found ${projects.length} projects to update`);

    for (const project of projects) {
      if (project.image) {
        try {
          console.log('Original URL:', project.image.original);
          const originalBlobName = extractBlobName(project.image.original);
          const thumbnailBlobName = extractBlobName(project.image.thumbnail);
          console.log('Extracted blob names:', { originalBlobName, thumbnailBlobName });

          const newOriginalUrl = getDirectUrl(originalsContainerClient, originalBlobName);
          const newThumbnailUrl = getDirectUrl(thumbnailsContainerClient, thumbnailBlobName);
          console.log('New URLs:', { newOriginalUrl, newThumbnailUrl });

          const updatedProject = {
            ...project,
            image: {
              original: newOriginalUrl,
              thumbnail: newThumbnailUrl
            }
          };

          await db.collection('projects').updateOne(
            { _id: project._id },
            { $set: { image: updatedProject.image } }
          );
          console.log(`Updated project: ${project._id}, Original blob: ${originalBlobName}`);
        } catch (error) {
          console.error(`Error updating project ${project._id}:`, error);
          console.error('Project data:', JSON.stringify(project.image, null, 2));
        }
      }
    }

    // Update Work Experiences
    const experiences = await db.collection('workexperiences').find({}).toArray();
    console.log(`Found ${experiences.length} work experiences to update`);

    for (const exp of experiences) {
      if (exp.companyLogo) {
        try {
          console.log('Original URL:', exp.companyLogo.original);
          const originalBlobName = extractBlobName(exp.companyLogo.original);
          const thumbnailBlobName = extractBlobName(exp.companyLogo.thumbnail);
          console.log('Extracted blob names:', { originalBlobName, thumbnailBlobName });

          const newOriginalUrl = getDirectUrl(originalsContainerClient, originalBlobName);
          const newThumbnailUrl = getDirectUrl(thumbnailsContainerClient, thumbnailBlobName);
          console.log('New URLs:', { newOriginalUrl, newThumbnailUrl });

          const updatedExp = {
            ...exp,
            companyLogo: {
              ...exp.companyLogo,
              original: newOriginalUrl,
              thumbnail: newThumbnailUrl
            }
          };

          await db.collection('workexperiences').updateOne(
            { _id: exp._id },
            { $set: { companyLogo: updatedExp.companyLogo } }
          );
          console.log(`Updated work experience: ${exp._id}, Original blob: ${originalBlobName}`);
        } catch (error) {
          console.error(`Error updating work experience ${exp._id}:`, error);
          console.error('Work experience data:', JSON.stringify(exp.companyLogo, null, 2));
        }
      }
    }

    // Update Basic Info (for profile picture)
    const basicInfo = await db.collection('basicinfos').findOne({});
    if (basicInfo && basicInfo.profilePicture) {
      try {
        console.log('Original URL:', basicInfo.profilePicture.original);
        const originalBlobName = extractBlobName(basicInfo.profilePicture.original);
        const thumbnailBlobName = extractBlobName(basicInfo.profilePicture.thumbnail);
        console.log('Extracted blob names:', { originalBlobName, thumbnailBlobName });

        const newOriginalUrl = getDirectUrl(originalsContainerClient, originalBlobName);
        const newThumbnailUrl = getDirectUrl(thumbnailsContainerClient, thumbnailBlobName);
        console.log('New URLs:', { newOriginalUrl, newThumbnailUrl });

        const updatedBasicInfo = {
          ...basicInfo,
          profilePicture: {
            original: newOriginalUrl,
            thumbnail: newThumbnailUrl
          }
        };

        await db.collection('basicinfos').updateOne(
          { _id: basicInfo._id },
          { $set: { profilePicture: updatedBasicInfo.profilePicture } }
        );
        console.log(`Updated basic info profile picture, Original blob: ${originalBlobName}`);
      } catch (error) {
        console.error('Error updating basic info:', error);
        console.error('Basic info data:', JSON.stringify(basicInfo.profilePicture, null, 2));
      }
    }

    console.log('All updates completed successfully');
  } catch (error) {
    console.error('Error updating image URLs:', error);
    throw error;
  } finally {
    await client.close();
  }
}

updateImageUrls().catch(console.error); 