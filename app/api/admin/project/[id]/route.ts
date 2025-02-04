import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Admin from '@/models/Admin';
import { logAction, logError } from '@/app/utils/logger';
import { AuthenticationError, ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/CustomErrors';
import { withErrorHandler } from '@/lib/errors/errorMiddleware';
import { authOptions } from '@/app/api/auth/auth.config';

async function handleGetProject(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new AuthenticationError('You must be logged in to access this resource');
  }

  try {
    await connectDB();
  } catch (error) {
    throw new DatabaseError('Failed to connect to database', { error });
  }

  const id = request.url.split('/').pop();
  if (!id) {
    throw new ValidationError('Project ID is required');
  }

  // Find the admin user
  const admin = await Admin.findOne({ username: session.user.email });
  if (!admin) {
    throw new NotFoundError('Admin user not found');
  }

  try {
    const project = await Project.findById(id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return NextResponse.json({ project });
  } catch (error) {
    await logError('system', 'Get project error', error as Error);
    throw new DatabaseError('Failed to fetch project', { error });
  }
}

async function handleDeleteProject(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new AuthenticationError('You must be logged in to access this resource');
  }

  try {
    await connectDB();
  } catch (error) {
    throw new DatabaseError('Failed to connect to database', { error });
  }

  const id = request.url.split('/').pop();
  if (!id) {
    throw new ValidationError('Project ID is required');
  }

  // Find the admin user
  const admin = await Admin.findOne({ username: session.user.email });
  if (!admin) {
    throw new NotFoundError('Admin user not found');
  }

  // Only allow deleting projects created by this admin
  const project = await Project.findOne({ _id: id, createdBy: admin._id });
  if (!project) {
    await logAction('Project deletion failed - not found or unauthorized', { projectId: id });
    throw new NotFoundError('Project not found or you do not have permission to delete it');
  }

  try {
    await project.deleteOne();
    
    await logAction('Project deleted successfully', {
      projectId: id,
      projectName: project.title,
      deletedBy: session.user.email
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    await logError('system', 'Delete project error', error as Error);
    throw new DatabaseError('Failed to delete project', { error });
  }
}

async function handleUpdateProject(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new AuthenticationError('You must be logged in to access this resource');
  }

  try {
    await connectDB();
  } catch (error) {
    throw new DatabaseError('Failed to connect to database', { error });
  }

  const id = request.url.split('/').pop();
  if (!id) {
    throw new ValidationError('Project ID is required');
  }

  let data;
  try {
    data = await request.json();
  } catch (error) {
    throw new ValidationError('Invalid request body', { error });
  }

  // Find the admin user
  const admin = await Admin.findOne({ username: session.user.email });
  if (!admin) {
    throw new NotFoundError('Admin user not found');
  }

  // Only allow updating projects created by this admin
  const project = await Project.findOne({ _id: id, createdBy: admin._id });
  if (!project) {
    await logAction('Project update failed - not found or unauthorized', { projectId: id });
    throw new NotFoundError('Project not found or you do not have permission to update it');
  }

  // Validate fields if they are being updated
  if (data.title && data.title.length > 50) {
    throw new ValidationError('Title must be 50 characters or less', {
      field: 'title',
      maxLength: 50,
      currentLength: data.title.length
    });
  }

  if (data.description && data.description.length > 300) {
    throw new ValidationError('Description must be 300 characters or less', {
      field: 'description',
      maxLength: 300,
      currentLength: data.description.length
    });
  }

  if (data.category && !['product', 'software', 'content'].includes(data.category)) {
    throw new ValidationError('Invalid category', {
      field: 'category',
      allowedValues: ['product', 'software', 'content'],
      received: data.category
    });
  }

  try {
    Object.assign(project, data);
    await project.save();

    await logAction('Project updated successfully', {
      projectId: id,
      projectName: project.title,
      updatedBy: session.user.email,
      changes: data
    });

    return NextResponse.json({ message: 'Project updated successfully', project });
  } catch (error) {
    await logError('system', 'Update project error', error as Error);
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ValidationError('Invalid project data', { error });
    }
    throw new DatabaseError('Failed to update project', { error });
  }
}

export const GET = withErrorHandler(handleGetProject);
export const DELETE = withErrorHandler(handleDeleteProject);
export const PUT = withErrorHandler(handleUpdateProject); 