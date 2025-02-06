import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Admin from '@/models/Admin';
import Category from '@/models/Category';
import { logAction, logError } from '@/app/utils/logger';
import { authOptions } from '@/app/api/auth/auth.config';
import { AuthenticationError, ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/CustomErrors';
import { withErrorHandler } from '@/lib/errors/errorMiddleware';
import { CategoryType } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { InvalidCategoryError } from '@/app/utils/errors/ProjectErrors';

// Type guard for CategoryType
function isValidCategory(category: unknown): category is CategoryType {
  return typeof category === 'string' && Object.keys(CATEGORY_CONFIG).includes(category);
}

async function handleGetProjects(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new AuthenticationError('You must be logged in to access this resource');
  }

  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error:', error);
    throw new DatabaseError('Failed to connect to database', { 
      error,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Find the admin user by username (stored in email field of session)
  const admin = await Admin.findOne({ username: session.user.email });
  if (!admin) {
    console.error('Admin not found for username:', session.user.email);
    throw new NotFoundError('Admin user not found');
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  if (!category) {
    console.error('Missing category parameter');
    throw new InvalidCategoryError('Category parameter is required');
  }

  if (!isValidCategory(category)) {
    console.error('Invalid category:', category);
    throw new InvalidCategoryError(`Invalid category: ${category}`);
  }

  try {
    // Ensure Category model is loaded before using Project model
    const categoryDoc = await Category.findOne({ category });  // Find by category string
    if (!categoryDoc) {
      throw new NotFoundError(`Category ${category} not found`);
    }
    
    const query = { category: categoryDoc._id };  // Use the category document's ID
    console.log('Executing project query:', query);
    const projects = await Project.find(query)
      .populate('category')  // Populate the category reference
      .sort({ createdAt: -1 });
    console.log(`Found ${projects.length} projects`);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Project fetch error:', error);
    await logError('system', 'Get projects error', error as Error);
    throw new DatabaseError('Failed to fetch projects', { 
      error,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCreateProject(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new AuthenticationError('You must be logged in to access this resource');
  }

  try {
    await connectDB();
  } catch (error) {
    throw new DatabaseError('Failed to connect to database', { error });
  }
  
  const data = await request.json();
  
  // Validate required fields
  const requiredFields = ['title', 'description', 'category'];
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new ValidationError('Missing required fields', {
      missingFields: missingFields.reduce((acc, field) => ({
        ...acc,
        [field]: `${field} is required`
      }), {})
    });
  }

  // Validate field lengths
  if (data.title.length > 50) {
    throw new ValidationError('Title must be 50 characters or less', {
      field: 'title',
      maxLength: 50,
      currentLength: data.title.length
    });
  }

  if (data.description.length > 300) {
    throw new ValidationError('Description must be 300 characters or less', {
      field: 'description',
      maxLength: 300,
      currentLength: data.description.length
    });
  }

  // Validate category
  if (!['product', 'software', 'content', 'innovation'].includes(data.category)) {
    throw new ValidationError('Invalid category', {
      field: 'category',
      allowedValues: ['product', 'software', 'content', 'innovation'],
      received: data.category
    });
  }

  // Find the admin user
  const admin = await Admin.findOne({ username: session.user.email });
  if (!admin) {
    throw new NotFoundError('Admin user not found');
  }

  try {
    // Find the category document first
    const categoryDoc = await Category.findOne({ category: data.category });
    if (!categoryDoc) {
      throw new NotFoundError(`Category ${data.category} not found`);
    }

    // Create project with category reference
    const project = await Project.create({
      ...data,
      category: categoryDoc._id,  // Use the category document's ID
      createdBy: admin._id
    });
    
    // Populate the category before returning
    await project.populate('category');
    
    await logAction('Project created', {
      projectId: project._id.toString(),
      projectName: project.title,
      createdBy: session.user.email
    });

    return NextResponse.json({ project });
  } catch (error) {
    await logError('system', 'Create project error', error as Error);
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ValidationError('Invalid project data', { error });
    }
    throw new DatabaseError('Failed to create project', { error });
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

  const data = await request.json();
  const { id, ...updateData } = data;

  if (!id) {
    throw new ValidationError('Project ID is required');
  }
  
  // Find the admin user
  const admin = await Admin.findOne({ username: session.user.email });
  if (!admin) {
    throw new NotFoundError('Admin user not found');
  }
  
  // Validate fields if they are being updated
  if (updateData.title && updateData.title.length > 50) {
    throw new ValidationError('Title must be 50 characters or less', {
      field: 'title',
      maxLength: 50,
      currentLength: updateData.title.length
    });
  }

  if (updateData.description && updateData.description.length > 300) {
    throw new ValidationError('Description must be 300 characters or less', {
      field: 'description',
      maxLength: 300,
      currentLength: updateData.description.length
    });
  }

  if (updateData.category && !['product', 'software', 'content', 'innovation'].includes(updateData.category)) {
    throw new ValidationError('Invalid category', {
      field: 'category',
      allowedValues: ['product', 'software', 'content', 'innovation'],
      received: updateData.category
    });
  }

  // Only allow updating projects created by this admin
  const project = await Project.findOne({ _id: id, createdBy: admin._id });
  if (!project) {
    await logAction('Project update failed - not found or unauthorized', { projectId: id });
    throw new NotFoundError('Project not found or you do not have permission to update it');
  }

  try {
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
  } catch (error) {
    await logError('system', 'Update project error', error as Error);
    throw new DatabaseError('Failed to update project', { error });
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

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
    await Project.findByIdAndDelete(id);

    await logAction('Project deleted', {
      projectId: id,
      projectName: project.title,
      deletedBy: session.user.email
    });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    await logError('system', 'Delete project error', error as Error);
    throw new DatabaseError('Failed to delete project', { error });
  }
}

export const GET = withErrorHandler(handleGetProjects);
export const POST = withErrorHandler(handleCreateProject);
export const PUT = withErrorHandler(handleUpdateProject);
export const DELETE = withErrorHandler(handleDeleteProject); 