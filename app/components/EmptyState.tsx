import { EmptyStateProps } from '@/types/projects';
import { CATEGORY_CONFIG } from '../config/categories';
import Link from 'next/link';
import { Button } from './ui/button';

export default function EmptyState({ category }: EmptyStateProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
      <h3 className="mt-2 text-xl font-semibold text-white">
        No {config.title} yet
      </h3>
      <p className="mt-1 text-sm text-gray-300">
        Get started by creating your first {category} project.
      </p>
      <div className="mt-6">
        <Link href={`/admin/project/add?category=${category}`}>
          <Button>
            Create {category} project
          </Button>
        </Link>
      </div>
    </div>
  );
} 