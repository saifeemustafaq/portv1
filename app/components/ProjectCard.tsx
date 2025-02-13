'use client';

import { ProjectCardProps, ProjectCategory } from '../../types/projects';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '../hooks/useCategories';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const { categories } = useCategories();

  // Get category settings
  const categoryType = typeof project.category === 'string' 
    ? project.category 
    : (project.category as ProjectCategory).category;

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
        <div className="relative w-48 h-48 rounded-lg overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={project.title}
              fill
              className="object-contain bg-black/20"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
            >
              <span className="text-[#94a3b8] text-sm">No image available</span>
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