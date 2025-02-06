import { useState, useEffect } from 'react';
import { CategoryConfig, ProjectCategory, CategoryType } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';

interface ExtendedCategoryConfig extends CategoryConfig {
  enabled: boolean;
  colorPalette: string;
}

const getDefaultColorPalette = (categoryType: CategoryType): string => {
  switch(categoryType) {
    case 'product':
      return 'forest-haven';
    case 'software':
      return 'sunset-glow';
    case 'content':
      return 'royal-purple';
    case 'innovation':
      return 'cherry-blossom';
    default:
      return 'ocean-depths';
  }
};

export function useCategories() {
  const [categories, setCategories] = useState<Record<CategoryType, ExtendedCategoryConfig>>(() => {
    // Initialize with default categories and their specific color palettes
    const defaults = Object.entries(CATEGORY_CONFIG).reduce((acc, [key, value]) => {
      const categoryType = key as CategoryType;
      return {
        ...acc,
        [key]: {
          ...value,
          enabled: true,
          colorPalette: getDefaultColorPalette(categoryType),
        },
      };
    }, {} as Record<CategoryType, ExtendedCategoryConfig>);
    console.log('Initial default categories:', defaults);
    return defaults;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from API...');
      const response = await fetch('/api/admin/settings/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      console.log('API Response:', {
        status: response.status,
        categories: data.categories,
      });
      setCategories(data.categories);
      setError(null);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load category settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useCategories hook mounted, fetching data...');
    fetchCategories();
  }, []);

  const getEnabledCategories = () => {
    const enabled = Object.entries(categories)
      .filter(([_, config]) => config.enabled)
      .reduce((acc, [key, value]) => {
        return {
          ...acc,
          [key]: value,
        };
      }, {} as Record<CategoryType, ExtendedCategoryConfig>);
    console.log('Enabled categories:', enabled);
    return enabled;
  };

  return {
    categories,
    loading,
    error,
    getEnabledCategories,
    refetch: fetchCategories,
  };
} 