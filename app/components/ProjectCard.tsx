'use client';

import { ProjectCardProps, CategoryType, CategoryConfig } from '../../types/projects';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { formatDate } from '../utils/dateFormatter';
import { useCategories } from '../hooks/useCategories';
import Link from 'next/link';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';

interface ExtendedCategoryConfig extends CategoryConfig {
  color: string;
  enabled: boolean;
  colorPalette?: string;
}

type CategorySettings = Record<CategoryType, ExtendedCategoryConfig>;

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const { categories, loading, error } = useCategories();
  
  // If categories are still loading, show a loading state
  if (loading) {
    return (
      <div className="rounded-xl p-6 bg-gray-800/50 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  // Debug log
  console.log('Project:', {
    id: project._id,
    title: project.title,
    category: project.category,
  });
  console.log('Categories from hook:', categories);

  // Handle both string and object category types
  const categoryType = typeof project.category === 'string' 
    ? project.category as CategoryType
    : project.category.category;
    
  console.log('Category Type:', categoryType);

  // Get the category settings and its color palette
  const categorySettings = (categories as CategorySettings)?.[categoryType];
  console.log('Category Settings:', {
    categoryType,
    settings: categorySettings,
    allCategories: categories,
  });
  
  // Use the category's assigned color palette or fall back to a default
  const palette = categorySettings?.colorPalette 
    ? COLOR_PALETTES.find(p => p.id === categorySettings.colorPalette)
    : COLOR_PALETTES.find(p => {
        switch(categoryType) {
          case 'product':
            return p.id === 'forest-haven';
          case 'software':
            return p.id === 'sunset-glow';
          case 'content':
            return p.id === 'royal-purple';
          case 'innovation':
            return p.id === 'cherry-blossom';
          default:
            return p.id === 'ocean-depths';
        }
      });

  // If no palette is found, use the first one as fallback
  const activePalette = palette || COLOR_PALETTES[0];
  console.log('Color Selection:', {
    categoryType,
    settingsColorPalette: categorySettings?.colorPalette,
    foundPalette: palette?.id,
    activePaletteId: activePalette.id,
    activePaletteColors: activePalette.colors,
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await onDelete(project._id);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: activePalette.colors.muted || 'rgba(59, 130, 246, 0.1)',
        borderColor: activePalette.colors.primary || '#3b82f6',
        borderWidth: '1px',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6 flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 
              className="text-xl font-bold mb-2 text-white group-hover:text-white/90 transition-colors duration-300"
            >
              {project.title}
            </h3>
            <p 
              className="text-gray-200/90 text-sm line-clamp-2"
            >
              {project.description}
            </p>
          </div>
        </div>

        {/* Tags with improved styling */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full font-medium transition-colors duration-300"
                style={{
                  backgroundColor: `${activePalette.colors.accent || '#93c5fd'}20`,
                  color: '#ffffff',
                  border: `1px solid ${activePalette.colors.accent || '#93c5fd'}40`
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Project metadata with improved layout */}
        <div 
          className="text-xs space-y-1 pt-4 border-t"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="flex items-center justify-between text-gray-300">
            <span className="flex items-center gap-1">
              <span className="text-gray-400">Created:</span> 
              {formatDate(project.createdAt)}
            </span>
            {project.updatedAt && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Updated:</span>
                {formatDate(project.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons with improved styling */}
      <div className="p-4 border-t border-current/10 bg-black/5">
        <div className="flex gap-2 justify-end">
          <Link href={`/admin/project/add?id=${project._id}&category=${project.category}`}>
            <button
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 hover:bg-white/10"
              style={{ color: activePalette.colors.primary || '#3b82f6' }}
            >
              Edit
            </button>
          </Link>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 transition-colors duration-300 hover:bg-red-500/20"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 