import { CategoryConfig, CategoryType } from '@/types/projects';

export const CATEGORY_CONFIG: Record<CategoryType, CategoryConfig> = {
  product: {
    title: 'Product Projects',
    description: 'Manage your product portfolio projects',
    category: 'product'
  },
  software: {
    title: 'Software Projects',
    description: 'Manage your software development projects',
    category: 'software'
  },
  content: {
    title: 'Content Projects',
    description: 'Manage your content and media projects',
    category: 'content'
  },
  innovation: {
    title: 'Innovation Projects',
    description: 'Manage your innovation and research projects',
    category: 'innovation'
  }
}; 