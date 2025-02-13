import { ReactNode } from 'react';

export type CategoryType = 'product' | 'software' | 'content' | 'innovation';

export interface ProjectCategory {
  _id: string;
  name: string;
  description?: string;
  colorPalette?: string;
  createdAt: Date;
  updatedAt: Date;
  category: CategoryType;
  enabled: boolean;
  title: string;
}

export interface CategoryConfig {
  title: string;
  description: string;
  category: CategoryType;
  icon?: ReactNode;
}

export interface ProjectImage {
  original: string;
  thumbnail: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  image?: string | ProjectImage;
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