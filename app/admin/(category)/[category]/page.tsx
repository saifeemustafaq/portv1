import React from 'react';
import { CategoryType, ProjectCategory } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ProjectFetchError } from '@/app/utils/errors/ProjectErrors';
import CategoryPageClient from './CategoryPageClient';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/auth.config';
import { logError } from '@/app/utils/logger';

// Type guard for CategoryType
function isValidCategory(category: string): category is CategoryType {
  return Object.keys(CATEGORY_CONFIG).includes(category);
}

async function getProjects(category: CategoryType) {
  try {
    // Get the current request headers
    const headersList = await headers();
    const cookie = headersList.get('cookie');
    const host = headersList.get('host') || 'localhost:3000';
    
    // Determine if we're in a local environment
    const isLocalhost = host.includes('localhost') || host.match(/\d+\.\d+\.\d+\.\d+/);
    const protocol = isLocalhost ? 'http' : 'https';

    // Construct absolute URL using headers
    const url = new URL(`/api/admin/project`, `${protocol}://${host}`);
    url.searchParams.set('category', category);

    console.log('[getProjects] Fetching from:', url.toString());

    const response = await fetch(url, {
      cache: 'no-store', // Disable caching
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      credentials: 'include',
    });
    
    console.log('[getProjects] Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      
      const errorText = await response.text();
      console.error('[getProjects] Error response:', errorText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message;
      } catch {
        errorMessage = errorText;
      }
      throw new ProjectFetchError(category, errorMessage);
    }

    const data = await response.json();
    console.log('[getProjects] Successfully fetched projects:', data);
    return data;
  } catch (error) {
    console.error('[getProjects] Error:', error);
    await logError('system', 'Failed to fetch projects', error as Error);
    throw error;
  }
}

export type GenerateMetadata = ({ params }: { params: { category: string } }) => Promise<Metadata>;

// Type-safe interface for our page props
interface CategoryPageProps {
  params: { category: string };
  _searchParams: { [key: string]: string | string[] | undefined };
}

// Using a type assertion to work around Next.js 15.1.6 type system bug
// while maintaining type safety for our component's implementation
export default async function Page({ params, _searchParams }: CategoryPageProps) {
  console.log('[Page] Rendering with params:', params);

  // First check authentication
  const session = await getServerSession(authOptions);
  console.log('[Page] Session status:', !!session);
  
  if (!session?.user?.email) {
    console.log('[Page] No session, redirecting to login');
    redirect(`/admin/login?returnUrl=${encodeURIComponent(`/admin/${params.category}`)}`);
  }

  // Validate category
  if (!params.category || !isValidCategory(params.category)) {
    console.log('[Page] Invalid category:', params.category);
    notFound();
  }

  const config = CATEGORY_CONFIG[params.category];
  let projects;
  
  try {
    console.log('[Page] Fetching projects for category:', params.category);
    const response = await getProjects(params.category);
    projects = response.projects;
    console.log('[Page] Projects fetched:', projects?.length);
  } catch (error) {
    console.error('[Page] Error fetching projects:', error);
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect(`/admin/login?returnUrl=${encodeURIComponent(`/admin/${params.category}`)}`);
    }
    throw error;
  }

  // Create a ProjectCategory object from the category type and config
  const categoryObject: ProjectCategory = {
    _id: params.category,
    name: config.title,
    description: config.description,
    category: params.category,
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

export const dynamic = 'force-dynamic'; 