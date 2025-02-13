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

  // Get category settings
  const categoryType = typeof project.category === 'string' 
    ? project.category 
    : project.category.category;

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
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await onDelete(project._id);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  // Get image URL
  const imageUrl = project.image && typeof project.image === 'object' 
    ? project.image.thumbnail 
    : null;

  return (
    <div 
      className="overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] relative group"
      style={{ 
        background: `linear-gradient(to bottom, 
          ${activePalette.colors.primary}10,
          ${activePalette.colors.primary}05
        )`,
        border: `1px solid ${activePalette.colors.primary}20`
      }}
    >
      {/* Project Image */}
      <div className="relative aspect-video">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br"
            style={{
              background: `linear-gradient(135deg, 
                ${activePalette.colors.primary}20 0%, 
                ${activePalette.colors.primary}10 100%
              )`
            }}
          >
            <span className="text-[#94a3b8] text-sm">No image available</span>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="p-6">
        <h3 
          className="text-xl font-semibold mb-2 line-clamp-2"
          style={{ color: activePalette.colors.accent }}
        >
          {project.title}
        </h3>
        <p className="text-[#94a3b8] text-sm line-clamp-3 mb-4">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full"
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
        )}

        {/* Skills */}
        {project.skills && project.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full"
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
        )}
      </div>

      {/* Action Buttons */}
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