'use client';

import { ProjectGridProps } from '@/types/projects';
import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects, onDelete }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 