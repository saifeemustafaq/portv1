'use client';

import { ProjectCardProps, CategoryType, CategoryConfig, ProjectCategory } from '../../types/projects';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '../hooks/useCategories';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';
import { formatDate } from '../utils/dateFormatter';
import { useState, useEffect } from 'react';

interface ExtendedCategoryConfig extends CategoryConfig {
  color: string;
  enabled: boolean;
  colorPalette?: string;
}

type CategorySettings = Record<CategoryType, ExtendedCategoryConfig>;

function getCategoryValue(category: string | ProjectCategory): CategoryType {
  if (typeof category === 'string') {
    return category as CategoryType;
  }
  return category.category;
}

// Add placeholder icon generator
function getPlaceholderIcon(category: CategoryType, color: string) {
  const commonProps = {
    width: 96,
    height: 96,
    className: "rounded-lg object-cover w-full h-full p-2",
  };

  const icons = {
    software: (
      <svg {...commonProps} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" fill="transparent"/>
        <path d="M30 48L42 60M42 36L30 48L42 36ZM54 60L66 48L54 36" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    product: (
      <svg {...commonProps} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" fill="transparent"/>
        <path d="M48 24L72 36V60L48 72L24 60V36L48 24Z" stroke={color} strokeWidth="4" strokeLinejoin="round"/>
        <path d="M48 72V48M48 48L72 36M48 48L24 36" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    content: (
      <svg {...commonProps} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" fill="transparent"/>
        <path d="M30 36h36M30 48h36M30 60h24" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <rect x="24" y="24" width="48" height="48" rx="4" stroke={color} strokeWidth="4"/>
      </svg>
    ),
    innovation: (
      <svg {...commonProps} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="96" fill="transparent"/>
        <path d="M48 28v40M32 48h32M48 68c6.627 0 12-5.373 12-12s-5.373-12-12-12-12 5.373-12 12 5.373 12 12 12z" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      </svg>
    )
  };

  return icons[category] || icons.software;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const { categories, loading } = useCategories();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchImageUrl() {
      if (project.image) {
        try {
          console.log('Raw project image data:', project.image);
          
          // If image is an object with thumbnail property, use that
          if (typeof project.image === 'object' && project.image.thumbnail) {
            console.log('Using thumbnail from image object:', project.image.thumbnail);
            const imgSrc = project.image.thumbnail;
            
            // If it's already a full URL with SAS token, use it directly
            if (imgSrc.includes('?')) {
              console.log('Using existing URL with SAS token');
              setImageUrl(imgSrc);
            } else {
              // Get a fresh SAS URL from our API
              console.log('Fetching fresh SAS URL for:', imgSrc);
              const fileName = imgSrc.split('/').pop();
              if (fileName) {
                const response = await fetch(`/api/admin/get-image-url?fileName=${encodeURIComponent(fileName)}&thumbnail=true`);
                if (!response.ok) {
                  throw new Error('Failed to get image URL');
                }
                const data = await response.json();
                console.log('Generated SAS URL:', data.url);
                setImageUrl(data.url);
              } else {
                console.error('Could not extract filename from:', imgSrc);
                setImageError(true);
              }
            }
          } else if (typeof project.image === 'string') {
            console.log('Using string image path:', project.image);
            // Get a fresh SAS URL from our API
            const response = await fetch(`/api/admin/get-image-url?fileName=${encodeURIComponent(project.image)}&thumbnail=true`);
            if (!response.ok) {
              throw new Error('Failed to get image URL');
            }
            const data = await response.json();
            console.log('Generated SAS URL for string path:', data.url);
            setImageUrl(data.url);
          } else {
            console.error('Invalid image data structure:', project.image);
            setImageError(true);
          }
        } catch (error) {
          console.error('Error processing image URL:', error);
          setImageError(true);
        }
      } else {
        console.log('No image data available for project:', project.title);
      }
    }

    fetchImageUrl();
  }, [project.image, project.title]);

  if (loading) {
    return (
      <div className="rounded-xl p-6 bg-gray-800/50 backdrop-blur-lg animate-pulse">
        <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700/50 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
      </div>
    );
  }

  const categoryType = typeof project.category === 'string' 
    ? project.category as CategoryType
    : project.category.category;

  const categorySettings = (categories as CategorySettings)?.[categoryType];
  
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
      data-project-id={project._id}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: `linear-gradient(135deg, 
          ${activePalette.colors.primary}15 0%, 
          ${activePalette.colors.primary}05 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${activePalette.colors.primary}30`,
        boxShadow: `0 4px 24px -1px ${activePalette.colors.primary}10`,
      }}
    >
      {/* Glass overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, 
            ${activePalette.colors.primary}20 0%, 
            ${activePalette.colors.accent}10 100%)`,
          backdropFilter: 'blur(10px)',
        }}
      />
      
      {/* Content */}
      <div className="relative p-8 flex flex-col space-y-6">
        <div className="flex items-start justify-between gap-6">
          {/* Project Image */}
          <div className="w-24 h-24 flex-shrink-0">
            <div 
              className="w-full h-full rounded-lg"
              style={{ backgroundColor: `${activePalette.colors.primary}20` }}
            >
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt={project.title}
                  width={96}
                  height={96}
                  className="rounded-lg object-cover w-full h-full"
                  unoptimized={true}
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    setImageError(true);
                  }}
                />
              ) : (
                getPlaceholderIcon(categoryType, activePalette.colors.accent)
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 
              className="text-2xl font-bold mb-3 text-white/90 group-hover:text-white transition-colors duration-300"
              style={{
                textShadow: `0 2px 10px ${activePalette.colors.primary}40`
              }}
            >
              {project.title}
            </h3>
            <p 
              className="text-white/70 text-base line-clamp-2 group-hover:text-white/80 transition-colors duration-300"
            >
              {project.description}
            </p>
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-4 py-1.5 rounded-full font-medium transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, 
                    ${activePalette.colors.primary}20 0%, 
                    ${activePalette.colors.primary}10 100%)`,
                  border: `1px solid ${activePalette.colors.primary}30`,
                  color: activePalette.colors.accent,
                  backdropFilter: 'blur(5px)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div 
          className="text-sm space-y-2 pt-4 border-t transition-colors duration-300"
          style={{ borderColor: `${activePalette.colors.primary}20` }}
        >
          <div className="flex items-center justify-between text-white/60 group-hover:text-white/70">
            <span className="flex items-center gap-2">
              <span className="text-white/50">Created</span> 
              {formatDate(project.createdAt)}
            </span>
            {project.updatedAt && (
              <span className="flex items-center gap-2">
                <span className="text-white/50">Updated</span>
                {formatDate(project.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div 
        className="p-6 border-t transition-colors duration-300 backdrop-blur-sm"
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
              className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, 
                  ${activePalette.colors.primary}30 0%, 
                  ${activePalette.colors.primary}20 100%)`,
                color: activePalette.colors.accent,
                border: `1px solid ${activePalette.colors.primary}30`,
                backdropFilter: 'blur(5px)',
              }}
            >
              Edit
            </button>
          </Link>
          <button
            onClick={handleDelete}
            className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              color: '#FCA5A5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(5px)',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 