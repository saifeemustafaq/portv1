'use client';

import { useState, useCallback } from 'react';
import { ProjectCardProps, ProjectCategory } from '../../types/projects';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '../hooks/useCategories';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';
import { logClientError, logClientAction } from '@/app/utils/clientLogger';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { Card as _Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

// Enhanced ProjectCardProps with isDeleting
export interface EnhancedProjectCardProps extends ProjectCardProps {
  isDeleting?: boolean;
}

// Main component wrapped in error boundary
export default function ProjectCard({ project, onDelete, isDeleting }: EnhancedProjectCardProps) {
  return (
    <ErrorBoundary name={`ProjectCard-${project._id}`}>
      <ProjectCardContent project={project} onDelete={onDelete} isDeleting={isDeleting} />
    </ErrorBoundary>
  );
}

// Actual content component
function ProjectCardContent({ project, onDelete, isDeleting = false }: EnhancedProjectCardProps) {
  const [error, setError] = useState<Error | null>(null);
  const [imageError, setImageError] = useState(false);
  const { categories, loading: _categoriesLoading, error: categoriesError } = useCategories();

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
    logClientError('system', 'Failed to load project image', new Error(`Image load failed for project ${project._id}`))
      .catch(loggingError => console.error('Failed to log error:', loggingError));
  }, [project._id]);

  // Get category settings
  const categoryType = typeof project.category === 'string' 
    ? project.category 
    : (project.category as ProjectCategory).category;

  // Handle category error
  if (categoriesError) {
    logClientError('system', 'Failed to load categories in ProjectCard', 
      typeof categoriesError === 'string' ? new Error(categoriesError) : new Error('Unknown categories error')
    ).catch(loggingError => console.error('Failed to log error:', loggingError));
  }

  const categorySettings = categories[categoryType];

  // Get color palette
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

  const activePalette = palette || COLOR_PALETTES[0];

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent multiple clicks
    
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        // Log the action
        logClientAction('User confirmed project deletion', { 
          projectId: project._id,
          projectTitle: project.title
        }).catch(err => console.error('Failed to log action:', err));
        
        await onDelete(project._id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error deleting project';
        
        setError(err instanceof Error ? err : new Error(errorMessage));
        
        // Log the error
        logClientError('system', 'Error in ProjectCard delete handler', 
          err instanceof Error ? err : new Error(errorMessage)
        ).catch(loggingError => console.error('Failed to log error:', loggingError));
        
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  // Handle component error
  if (error) {
    return (
      <div 
        className="flex flex-col min-h-[200px] overflow-hidden rounded-lg border border-red-500/20 bg-red-500/10 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-[#94a3b8] mb-4 text-sm">{error.message}</p>
          <Button 
            onClick={() => setError(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            size="sm"
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  // Get image URL
  const imageUrl = project.image && typeof project.image === 'object' 
    ? project.image.original 
    : null;

  return (
    <div 
      className="flex flex-col min-h-[600px] overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] relative group"
      style={{ 
        background: `linear-gradient(to bottom, 
          ${activePalette.colors.primary}10,
          ${activePalette.colors.primary}05
        )`,
        border: `1px solid ${activePalette.colors.primary}20`
      }}
    >
      {/* Project Image */}
      <div className="relative w-full flex justify-center p-4 shrink-0 bg-gradient-to-br"
           style={{
             background: `linear-gradient(135deg, 
               ${activePalette.colors.primary}20 0%, 
               ${activePalette.colors.primary}10 100%
             )`
           }}>
        <div className="relative w-[200px] h-[150px] rounded-lg overflow-hidden">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="200px"
              priority
              onError={handleImageError}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: `${activePalette.colors.primary}15` }}
            >
              <span className="text-[#94a3b8] text-sm">
                {imageError ? 'Failed to load image' : 'No image available'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="flex flex-col flex-grow p-6 space-y-4 overflow-y-auto">
        <div className="space-y-3">
          <h3 
            className="text-xl font-semibold break-words"
            style={{ color: activePalette.colors.accent }}
          >
            {project.title}
          </h3>
          <p className="text-[#94a3b8] text-sm whitespace-pre-wrap break-words">
            {project.description}
          </p>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium" style={{ color: activePalette.colors.accent }}>Tags</h4>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-full break-words"
                  style={{ 
                    background: `${activePalette.colors.primary}20`,
                    color: activePalette.colors.accent,
                    border: `1px solid ${activePalette.colors.primary}30`
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {project.skills && project.skills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium" style={{ color: activePalette.colors.accent }}>Skills</h4>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-full break-words"
                  style={{ 
                    background: `${activePalette.colors.secondary}20`,
                    color: activePalette.colors.accent,
                    border: `1px solid ${activePalette.colors.secondary}30`
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div 
        className="p-6 border-t shrink-0 transition-colors duration-300 backdrop-blur-sm"
        style={{ 
          borderColor: `${activePalette.colors.primary}20`,
          background: `linear-gradient(to top, 
            ${activePalette.colors.primary}15,
            ${activePalette.colors.primary}05
          )`
        }}
      >
        <div className="flex gap-3 justify-end">
          <Link href={`/admin/project/add?id=${project._id}&category=${categoryType}`}>
            <button
              className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ 
                background: `linear-gradient(135deg, 
                  ${activePalette.colors.primary}30 0%, 
                  ${activePalette.colors.primary}20 100%)`,
                color: activePalette.colors.accent,
                border: `1px solid ${activePalette.colors.primary}30`,
                backdropFilter: 'blur(5px)',
              }}
              disabled={isDeleting}
            >
              Edit
            </button>
          </Link>
          <button
            onClick={handleDelete}
            className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center"
            style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              color: '#FCA5A5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(5px)',
            }}
            disabled={isDeleting}
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 