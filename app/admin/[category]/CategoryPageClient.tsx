'use client';

import { useState } from 'react';
import { ProjectCategory, Project } from '@/types/projects';
import ProjectGrid from '@/app/components/ProjectGrid';
import EmptyState from '@/app/components/EmptyState';
import { ProjectDeleteError } from '@/app/utils/errors/ProjectErrors';
import { Toast } from '@/app/components/ui/toast';

interface CategoryPageClientProps {
  projects: Project[];
  category: ProjectCategory;
}

export default function CategoryPageClient({ projects: initialProjects, category }: CategoryPageClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/project?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ProjectDeleteError(id, errorData.message || 'Failed to delete project');
      }

      // Remove the deleted project from the state
      setProjects(projects.filter(project => project._id !== id));
      setToast({ message: 'Project deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting project:', error);
      setToast({ 
        message: error instanceof ProjectDeleteError 
          ? error.message 
          : 'Failed to delete project. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <>
      {projects.length > 0 ? (
        <ProjectGrid
          projects={projects}
          onDelete={handleDelete}
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
    </>
  );
} 