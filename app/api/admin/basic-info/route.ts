import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import clientPromise from '@/app/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const basicInfo = await db.collection('basic_info').findOne({});

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

    const body = await request.json();
    const { name, yearsOfExperience, phone, email } = body;

    if (!name || !yearsOfExperience || !phone || !email) {
      return new NextResponse('All fields are required', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Update all fields at once
    await db.collection('basic_info').updateOne(
      {},
      { 
        $set: { 
          name,
          yearsOfExperience,
          phone,
          email,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/admin/basic-info:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
