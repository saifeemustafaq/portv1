import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Admin from '@/models/Admin';
import { logAction, logError } from '@/app/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    await connectDB();

    const query = category ? { category } : {};
    const projects = await Project.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ projects });
  } catch (error: Error | unknown) {
    console.error('Get projects error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();
    const data = await request.json();
    const project = await Project.create(data);
    
    await logAction('Project created', {
      projectId: project._id.toString(),
      projectName: project.name,
      createdBy: session.user?.email
    });

    return NextResponse.json(project);
  } catch (error) {
    await logError('action', 'Error creating project', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    
    const project = await Project.findByIdAndUpdate(id, updateData, { new: true });
    if (!project) {
      await logAction('Project update failed - not found', { projectId: id });
      return new NextResponse('Project not found', { status: 404 });
    }

    await logAction('Project updated', {
      projectId: project._id.toString(),
      projectName: project.name,
      updatedBy: session.user?.email,
      changes: updateData
    });

    return NextResponse.json(project);
  } catch (error) {
    await logError('action', 'Error updating project', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      await logAction('Project deletion failed - not found', { projectId: id });
      return new NextResponse('Project not found', { status: 404 });
    }

    await logAction('Project deleted', {
      projectId: id,
      projectName: project.name,
      deletedBy: session.user?.email
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await logError('action', 'Error deleting project', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 