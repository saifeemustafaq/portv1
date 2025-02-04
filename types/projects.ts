import { ReactNode } from 'react';

export type ProjectCategory = 'product' | 'software' | 'content' | 'innovation';

export interface CategoryConfig {
  title: string;
  description: string;
  category: ProjectCategory;
  icon?: ReactNode;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  image?: string;
  link?: string;
  tags?: string[];
  skills?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
  };
}

export interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => Promise<void>;
}

export interface ProjectGridProps {
  projects: Project[];
  onDelete: (id: string) => Promise<void>;
}

export interface EmptyStateProps {
  category: ProjectCategory;
} 