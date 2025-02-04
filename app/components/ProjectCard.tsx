'use client';

import { ProjectCardProps } from '../../types/projects';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { formatDate } from '../utils/dateFormatter';

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await onDelete(project._id);
    }
  };

  return (
    <Card className={`w-full ${project.category}-card`}>
      <CardHeader className="relative">
        {project.image && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <span className={`${project.category}-badge`}>
            {project.category}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{project.description}</p>
        {project.tags && project.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full bg-${project.category}/5 text-${project.category}-dark px-2 py-1 text-xs`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Created: {formatDate(project.createdAt)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 