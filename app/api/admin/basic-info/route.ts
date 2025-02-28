import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import clientPromise from '@/app/lib/mongodb';
import { uploadImage, deleteImage } from '@/app/utils/azureStorage';

interface ProfilePicture {
  relativePath: string;
  original: string;
  thumbnail: string;
}

interface BasicInfoData {
  name: string;
  yearsOfExperience: string;
  phone: string;
  email: string;
  profilePicture?: ProfilePicture;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('portfolio');
    const basicInfo = await db.collection('basic_info').findOne({});

    // If no basic info exists, return default values
    return NextResponse.json(basicInfo || {
      name: 'Mustafa Saifee',
      yearsOfExperience: '3+',
      phone: '+1 650 439 6380',
      email: 'msaifee@andrew.cmu.edu'
    });
  } catch (error) {
    console.error('Error in GET /api/admin/basic-info:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const yearsOfExperience = formData.get('yearsOfExperience') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const profilePicture = formData.get('profilePicture') as File | null;

    if (!name || !yearsOfExperience || !phone || !email) {
      return new NextResponse('Required fields are missing', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('portfolio');
    
    const updateData: Partial<BasicInfoData> = {
      name,
      yearsOfExperience,
      phone,
      email,
      updatedAt: new Date()
    };

    // Handle profile picture upload if provided
    if (profilePicture) {
      try {
        const buffer = await profilePicture.arrayBuffer();
        const fileName = `profile/profile-${Date.now()}-${profilePicture.name}`;
        
        // Upload to Azure Storage
        const { originalUrl, thumbnailUrl } = await uploadImage(
          Buffer.from(buffer),
          fileName
        );

        // Get current basic info to delete old profile picture if it exists
        const currentInfo = await db.collection('basic_info').findOne({});
        if (currentInfo?.profilePicture?.relativePath) {
          try {
            await deleteImage(currentInfo.profilePicture.relativePath);
          } catch (deleteError) {
            console.error('Error deleting old profile picture:', deleteError);
            // Continue with update even if delete fails
          }
        }

        updateData.profilePicture = {
          relativePath: fileName,
          original: originalUrl,
          thumbnail: thumbnailUrl
        };
      } catch (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        return new NextResponse('Failed to upload profile picture', { status: 500 });
      }
    }

    // Update all fields at once
    await db.collection('basic_info').updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );

    // Fetch and return the updated document
    const updatedInfo = await db.collection('basic_info').findOne({});
    return NextResponse.json(updatedInfo);
  } catch (error) {
    console.error('Error in PATCH /api/admin/basic-info:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
