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
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    // Construct absolute URL using headers
    const url = new URL(`/api/admin/project`, `${protocol}://${host}`);
    url.searchParams.set('category', category);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required - please log in again');
      }
      
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message;
      } catch {
        // If we get HTML back, it's likely a 404 page
        if (errorText.includes('<!DOCTYPE html>')) {
          throw new Error('Authentication required - please log in again');
        }
        errorMessage = errorText;
      }
      throw new ProjectFetchError(category, errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ProjectFetchError) {
      throw error;
    }
    throw new ProjectFetchError(category, error instanceof Error ? error.message : undefined);
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
  // First check authentication
  const session = await getServerSession(authOptions);
  
  // Destructure and await params at the start
  const { category } = await Promise.resolve(params);
  
  if (!session?.user?.email) {
    redirect(`/admin/login?returnUrl=${encodeURIComponent(`/admin/${category}`)}`);
  }

  // Validate category
  if (!category || !isValidCategory(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIG[category];
  let projects;
  
  try {
    const response = await getProjects(category);
    projects = response.projects;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect(`/admin/login?returnUrl=${encodeURIComponent(`/admin/${category}`)}`);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }

  // Create a ProjectCategory object from the category type and config
  const categoryObject: ProjectCategory = {
    _id: category,
    name: config.title,
    description: config.description,
    category: category,
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