import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import clientPromise from '@/app/lib/mongodb';
import mongoose from 'mongoose';
import { uploadImage } from '@/app/utils/azureStorage';

interface CompanyLogo {
  relativePath: string;
  original: string;
  thumbnail: string;
}

interface WorkExperience {
  companyName: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isPresent: boolean;
  description: string;
  website: string;
  companyLogo?: CompanyLogo | null;
  createdAt: Date;
  updatedAt: Date;
}

if (!process.env.MONGODB_DB) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_DB"');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const experiences = await db.collection('workexperiences')
      .find({})
      .sort({ startDate: -1 })
      .toArray();

    // URLs are now permanent, no need to regenerate them
    return NextResponse.json(experiences || []);
  } catch (error) {
    console.error('Error in GET /api/admin/work-experience:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const companyName = formData.get('companyName') as string;
    const position = formData.get('position') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const isPresent = formData.get('isPresent') === 'true';
    const description = formData.get('description') as string;
    const website = formData.get('website') as string;
    const companyLogo = formData.get('companyLogo') as File;

    if (!companyName || !position || !startDate || !description) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    let companyLogoUrls = null;
    if (companyLogo) {
      const buffer = Buffer.from(await companyLogo.arrayBuffer());
      const fileName = `${Date.now()}-${companyLogo.name}`;
      companyLogoUrls = await uploadImage(buffer, fileName);
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const workExperience = {
      companyName,
      position,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isPresent,
      description,
      website,
      companyLogo: companyLogoUrls ? {
        relativePath: companyLogo.name,
        original: companyLogoUrls.originalUrl, // This is now a permanent URL
        thumbnail: companyLogoUrls.thumbnailUrl // This is now a permanent URL
      } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('workexperiences').insertOne(workExperience);
    return NextResponse.json({ 
      message: 'Work experience created successfully',
      id: result.insertedId
    });

  } catch (error) {
    console.error('Error in POST /api/admin/work-experience:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('ID is required', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const result = await db.collection('workexperiences').deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return new NextResponse('Work experience not found', { status: 404 });
    }

    return NextResponse.json({ message: 'Work experience deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/work-experience:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('ID is required', { status: 400 });
    }

    const formData = await request.formData();
    const companyName = formData.get('companyName') as string;
    const position = formData.get('position') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const isPresent = formData.get('isPresent') === 'true';
    const description = formData.get('description') as string;
    const website = formData.get('website') as string;
    const logoFile = formData.get('logo') as File | null;

    if (!companyName || !position || !startDate || !description || (!endDate && !isPresent) || !website) {
      return new NextResponse('Required fields are missing', { status: 400 });
    }

    const updateData: Partial<WorkExperience> = {
      companyName,
      position,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isPresent,
      description,
      website,
      updatedAt: new Date()
    };

    // Only update logo if a new one is provided
    if (logoFile) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      const fileName = `work-experiences/${Date.now()}-${logoFile.name}`;
      const { originalUrl, thumbnailUrl } = await uploadImage(logoBuffer, fileName);
      updateData.companyLogo = {
        relativePath: fileName,
        original: originalUrl,
        thumbnail: thumbnailUrl
      };
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const result = await db.collection('workexperiences').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return new NextResponse('Work experience not found', { status: 404 });
    }

    return NextResponse.json({ message: 'Work experience updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/admin/work-experience:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 