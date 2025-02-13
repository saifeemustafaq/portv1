import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import clientPromise from '@/app/lib/mongodb';
import mongoose from 'mongoose';

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

    const body = await request.json();
    const { companyName, position, startDate, endDate, isPresent, description } = body;

    if (!companyName || !position || !startDate || !description || (!endDate && !isPresent)) {
      return new NextResponse('Required fields are missing', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const result = await db.collection('workexperiences').insertOne({
      companyName,
      position,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isPresent,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      message: 'Work experience added successfully',
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