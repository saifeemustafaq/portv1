import React from 'react';
import { CategoryType, ProjectCategory } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ProjectFetchError } from '@/app/utils/errors/ProjectErrors';
import CategoryPageClient from './CategoryPageClient';

// Helper function to get base URL for API requests
function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

// Type guard for CategoryType
function isValidCategory(category: string): category is CategoryType {
  return Object.keys(CATEGORY_CONFIG).includes(category);
}

async function getProjects(category: CategoryType) {
  try {
    const baseUrl = getBaseUrl();
    const url = new URL(`/api/admin/project`, baseUrl);
    url.searchParams.set('category', category);

    // Get the current request headers
    const headersList = await headers();
    const cookie = headersList.get('cookie');

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        // Forward the cookie header if it exists
        ...(cookie ? { Cookie: cookie } : {}),
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      // Check if we got redirected to login
      if (response.status === 401) {
        throw new Error('Authentication required - please log in again');
      }
      
      // Try to parse error as JSON, fallback to text if not JSON
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message;
      } catch {
        errorMessage = await response.text();
      }
      throw new ProjectFetchError(category, errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ProjectFetchError) {
      throw error;
    }
    throw new ProjectFetchError(category, error instanceof Error ? error.message : undefined);
  }
}

type Props = {
  params: { category: string };
};

async function Page({ params }: Props) {
  const { category } = params;
  
  // Validate category before type assertion
  if (!isValidCategory(category)) {
    notFound();
  }

  const validCategory = category as CategoryType;
  const config = CATEGORY_CONFIG[validCategory];
  let projects;
  
  try {
    const response = await getProjects(validCategory);
    projects = response.projects; // Extract the projects array from the response
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication required')) {
      // Redirect to login with return URL
      const returnUrl = `/admin/${validCategory}`;
      const loginUrl = `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      const { redirect } = await import('next/navigation');
      redirect(loginUrl);
    }
    // Let the error boundary handle other errors
    throw error instanceof Error ? error : new Error(String(error));
  }

  // Create a ProjectCategory object from the category type and config
  const categoryObject: ProjectCategory = {
    _id: validCategory,
    name: config.title,
    description: config.description,
    category: validCategory,
    enabled: true,
    title: config.title,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{config.title}</h1>
        <p className="mt-2 text-gray-600">{config.description}</p>
      </div>

      <CategoryPageClient projects={projects} category={categoryObject} />
    </div>
  );
}

export default Page as unknown as (props: Props) => Promise<React.ReactElement>; 