'use client';

import { useState } from 'react';
import { ProjectGridProps } from '@/types/projects';
import ProjectCard from './ProjectCard';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { logClientError } from '@/app/utils/clientLogger';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

// Enhanced ProjectGridProps with deleteInProgress
export interface EnhancedProjectGridProps extends ProjectGridProps {
  deleteInProgress?: string | null;
}

// Main component wrapped in error boundary
export default function ProjectGrid({ projects, onDelete, deleteInProgress }: EnhancedProjectGridProps) {
  return (
    <ErrorBoundary name="ProjectGrid">
      <ProjectGridContent projects={projects} onDelete={onDelete} deleteInProgress={deleteInProgress} />
    </ErrorBoundary>
  );
}

// Actual content component
function ProjectGridContent({ projects, onDelete, deleteInProgress }: EnhancedProjectGridProps) {
  const [error, setError] = useState<Error | null>(null);

  // Handle errors that might occur in the grid
  if (error) {
    return (
      <Card className="p-8 bg-[#0f1117] border border-red-500/20 rounded-lg">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error displaying projects</h3>
          <p className="text-[#94a3b8] mb-4">{error.message}</p>
          <Button 
            onClick={() => setError(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Dismiss
          </Button>
        </div>
      </Card>
    );
  }

  // Safely render the grid
  try {
    return (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onDelete={onDelete}
            isDeleting={deleteInProgress === project._id}
          />
        ))}
      </div>
    );
  } catch (err) {
    // Log the error
    const errorMessage = err instanceof Error ? err.message : 'Unknown error rendering project grid';
    logClientError('system', 'Error rendering project grid', 
      err instanceof Error ? err : new Error(errorMessage)
    ).catch(loggingError => console.error('Failed to log error:', loggingError));
    
    // Set error state to trigger error UI
    if (err instanceof Error && !error) {
      setError(err);
    } else if (!error) {
      setError(new Error(errorMessage));
    }
    
    // Fallback UI
    return (
      <Card className="p-8 bg-[#0f1117] border border-amber-500/20 rounded-lg">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <h3 className="text-xl font-semibold text-amber-400 mb-2">Unable to display projects</h3>
          <p className="text-[#94a3b8] mb-4">There was a problem displaying the projects. Please try again later.</p>
        </div>
      </Card>
    );
  }
} 