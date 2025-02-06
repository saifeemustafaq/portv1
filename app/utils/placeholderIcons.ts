// Collection of modern, minimalist SVG icons for different project categories
// Each category has its own distinct, professional icon design

import { ProjectCategory, CategoryType } from '@/types/projects';

const colors: Record<CategoryType, string> = {
  product: '#3B82F6', // Blue
  software: '#10B981', // Green
  content: '#8B5CF6',  // Purple
  innovation: '#F59E0B', // Amber
};

const categoryIcons: Record<CategoryType, (color: string) => string> = {
  product: (color: string) => `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#1a1f2e"/>
      <rect x="100" y="140" width="200" height="160" rx="8" stroke="${color}" stroke-width="16"/>
      <path d="M160 100h80l20 40H140l20-40z" fill="${color}" opacity="0.8"/>
      <rect x="140" y="200" width="120" height="60" rx="4" fill="${color}" opacity="0.3"/>
    </svg>
  `).toString('base64')}`,

  software: (color: string) => `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#1a1f2e"/>
      <path d="M130 160l-30 40 30 40M270 160l30 40-30 40" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
      <path d="M220 120l-40 160" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
      <rect x="100" y="100" width="200" height="200" rx="16" stroke="${color}" stroke-width="16" opacity="0.3"/>
    </svg>
  `).toString('base64')}`,

  content: (color: string) => `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#1a1f2e"/>
      <path d="M120 140h160M120 200h160M120 260h100" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
      <rect x="100" y="100" width="200" height="200" rx="16" stroke="${color}" stroke-width="16" opacity="0.3"/>
      <circle cx="280" cy="260" r="20" fill="${color}" opacity="0.8"/>
    </svg>
  `).toString('base64')}`,

  innovation: (color: string) => `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#1a1f2e"/>
      <circle cx="200" cy="180" r="60" stroke="${color}" stroke-width="16" opacity="0.3"/>
      <path d="M200 120v120M160 180h80M200 260v40" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="200" cy="180" r="20" fill="${color}" opacity="0.8"/>
    </svg>
  `).toString('base64')}`,
};

export function getRandomPlaceholder(category: CategoryType): string {
  // Ensure category is a valid CategoryType
  if (!(category in colors)) {
    console.warn(`Invalid category type: ${category}, using default`);
    return categoryIcons.software(colors.software);
  }

  // Generate the SVG
  const svg = categoryIcons[category](colors[category]);
  
  // Log for debugging
  console.log('Generated placeholder SVG:', {
    category,
    color: colors[category],
    svgLength: svg.length,
    svgStart: svg.substring(0, 100) + '...'
  });

  return svg;
} 