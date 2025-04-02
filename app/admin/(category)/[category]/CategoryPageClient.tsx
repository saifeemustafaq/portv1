'use client';

import { useState, useCallback, useEffect } from 'react';
import { ProjectCategory, Project } from '@/types/projects';
import ProjectGrid from '@/app/components/ProjectGrid';
import EmptyState from '@/app/components/EmptyState';
import { ProjectDeleteError } from '@/app/utils/errors/ProjectErrors';
import { Toast } from '@/app/components/ui/toast';
import { logClientError, logClientAction } from '@/app/utils/clientLogger';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface CategoryPageClientProps {
  projects: Project[];
  category: ProjectCategory;
}

// Main component
export default function CategoryPageClient({ projects: initialProjects, category }: CategoryPageClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Sync state when props change
  useEffect(() => {
    console.log('[CategoryPageClient] Received projects:', initialProjects?.length);
    setProjects(initialProjects);
  }, [initialProjects]);

  // Refresh projects data
  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Log the action
      logClientAction('Refreshing projects for category', { 
        category: category.category,
        categoryName: category.title
      }).catch(err => console.error('Failed to log action:', err));
      
      const response = await fetch(`/api/admin/projects?category=${category.category}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();
      setProjects(data.projects);
      
      // Reset retry count on success
      if (retryCount > 0) {
        setRetryCount(0);
        setToast({ message: 'Projects refreshed successfully', type: 'success' });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh projects';
      
      setError(err instanceof Error ? err : new Error(errorMessage));
      
      // Log the error
      logClientError('system', 'Failed to refresh projects', 
        err instanceof Error ? err : new Error(errorMessage)
      ).catch(loggingError => console.error('Failed to log error:', loggingError));
      
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [category, retryCount]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    refreshProjects();
  }, [refreshProjects]);

  const handleDelete = async (id: string) => {
    try {
      setDeleteInProgress(id);
      
      // Log the action
      logClientAction('Deleting project', { 
        projectId: id,
        category: category.category
      }).catch(err => console.error('Failed to log action:', err));
      
      const response = await fetch(`/api/admin/project?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ProjectDeleteError(id, errorData.message || 'Failed to delete project');
      }

      // Remove the deleted project from the state
      setProjects((currentProjects) => currentProjects.filter((project: Project) => project._id !== id));
      
      // Log successful deletion
      logClientAction('Project deleted successfully', { 
        projectId: id,
        category: category.category
      }).catch(err => console.error('Failed to log action:', err));
      
      setToast({ message: 'Project deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting project:', error);
      
      // Log the error
      logClientError('system', 'Failed to delete project', 
        error instanceof Error ? error : new Error('Unknown error during project deletion')
      ).catch(loggingError => console.error('Failed to log error:', loggingError));
      
      setToast({ 
        message: error instanceof ProjectDeleteError 
          ? error.message 
          : 'Failed to delete project. Please try again.',
        type: 'error'
      });
    } finally {
      setDeleteInProgress(null);
    }
  };

  // Show error state with retry button
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-8 bg-[#0f1117] border border-red-500/20 rounded-lg">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <h3 className="text-xl font-semibold text-red-400 mb-2">Failed to load projects</h3>
            <p className="text-[#94a3b8] mb-4">{error.message}</p>
            <Button 
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Retrying...' : `Retry (${retryCount})`}
            </Button>
          </div>
        </Card>
        
        {/* Fallback to show empty state */}
        <EmptyState category={category} />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="mb-4 p-2 bg-blue-500/10 text-blue-400 text-sm rounded-lg">
          Loading...
        </div>
      )}
      
      {projects.length > 0 ? (
        <ProjectGrid
          projects={projects}
          onDelete={handleDelete}
          deleteInProgress={deleteInProgress}
        />
      ) : (
        <EmptyState category={category} />
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Refresh button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={refreshProjects}
          disabled={isLoading}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#f8fafc] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Refreshing...</span>
            </div>
          ) : (
            'Refresh Projects'
          )}
        </Button>
      </div>
    </>
  );
} 