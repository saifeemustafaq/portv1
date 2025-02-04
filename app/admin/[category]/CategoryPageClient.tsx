'use client';

import { useState } from 'react';
import { ProjectCategory } from '@/types/projects';
import ProjectGrid from '@/app/components/ProjectGrid';
import EmptyState from '@/app/components/EmptyState';
import { ProjectDeleteError } from '@/app/utils/errors/ProjectErrors';

interface CategoryPageClientProps {
  projects: any[];
  category: ProjectCategory;
}

export default function CategoryPageClient({ projects: initialProjects, category }: CategoryPageClientProps) {
  const [projects, setProjects] = useState(initialProjects);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/project/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new ProjectDeleteError(id, error);
      }

      // Remove the deleted project from the state
      setProjects(projects.filter(project => project._id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      // You might want to show an error toast here
      if (error instanceof ProjectDeleteError) {
        alert(error.message);
      } else {
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  return projects.length > 0 ? (
    <ProjectGrid
      projects={projects}
      onDelete={handleDelete}
    />
  ) : (
    <EmptyState category={category} />
  );
} 