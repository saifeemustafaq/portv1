import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Admin from '@/models/Admin';
import { logAction, logError } from '@/app/utils/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 });
    }

    await connectDB();

    // Find the admin user by username (stored in email field of session)
    const admin = await Admin.findOne({ username: session.user.email });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const query = category ? { category } : {};
    const projects = await Project.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ projects });
  } catch (error: unknown) {
    console.error('Get projects error:', error);
    await logError('system', 'Get projects error', error as Error);
    return NextResponse.json(
      { error: 'An error occurred while fetching projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 });
    }

    await connectDB();
    
    const data = await request.json();
    
    if (!data.title || !data.description || !data.category) {
      return NextResponse.json(
        { error: 'Title, description and category are required' },
        { status: 400 }
      );
    }

    // Validate title length
    if (data.title.length > 50) {
      return NextResponse.json(
        { error: 'Title must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Validate description length
    if (data.description.length > 300) {
      return NextResponse.json(
        { error: 'Description must be 300 characters or less' },
        { status: 400 }
      );
    }

    // Validate category
    if (!['product', 'software', 'content'].includes(data.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Find the admin user by username (stored in email field of session)
    const admin = await Admin.findOne({ username: session.user.email });
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    const project = await Project.create({
      ...data,
      createdBy: admin._id
    });
    
    await logAction('Project created', {
      projectId: project._id.toString(),
      projectName: project.title,
      createdBy: session.user.email
    });

    return NextResponse.json({ project });
  } catch (error: unknown) {
    console.error('Create project error:', error);
    await logError('system', 'Create project error', error as Error);
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Invalid project data' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'An error occurred while creating the project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    
    // Find the admin user by username (stored in email field of session)
    const admin = await Admin.findOne({ username: session.user.email });
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields if they are being updated
    if (updateData.title && updateData.title.length > 50) {
      return NextResponse.json(
        { error: 'Title must be 50 characters or less' },
        { status: 400 }
      );
    }

    if (updateData.description && updateData.description.length > 300) {
      return NextResponse.json(
        { error: 'Description must be 300 characters or less' },
        { status: 400 }
      );
    }

    if (updateData.category && !['product', 'software', 'content'].includes(updateData.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }
    
    // Only allow updating projects created by this admin
    const project = await Project.findOne({ _id: id, createdBy: admin._id });
    if (!project) {
      await logAction('Project update failed - not found or unauthorized', { projectId: id });
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    await logAction('Project updated', {
      projectId: updatedProject._id.toString(),
      projectName: updatedProject.title,
      updatedBy: session.user.email,
      changes: updateData
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error: unknown) {
    console.error('Update project error:', error);
    await logError('system', 'Update project error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Find the admin user by username (stored in email field of session)
    const admin = await Admin.findOne({ username: session.user.email });
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Only allow deleting projects created by this admin
    const project = await Project.findOne({ _id: id, createdBy: admin._id });
    if (!project) {
      await logAction('Project deletion failed - not found or unauthorized', { projectId: id });
      return NextResponse.json({ error: 'Project not found or you do not have permission to delete it' }, { status: 404 });
    }

    await Project.findByIdAndDelete(id);

    await logAction('Project deleted', {
      projectId: id,
      projectName: project.title,
      deletedBy: session.user.email
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete project error:', error);
    await logError('system', 'Delete project error', error as Error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the project' },
      { status: 500 }
    );
  }
} 