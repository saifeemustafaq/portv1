'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RiAddCircleLine, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: 'product' | 'software' | 'content';
  image?: string;
  link?: string;
  tags?: string[];
  skills?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
  };
}

export default function ProductPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/project?category=product');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects');
      }

      setProjects(data.projects);
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/project/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project');
      }

      setProjects(projects.filter(project => project._id !== id));
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-lg text-[#94a3b8]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white serif">
            Product Projects
          </h1>
          <p className="mt-2 text-[#94a3b8]">
            Manage your product portfolio projects
          </p>
        </div>
        <Link
          href="/admin/project/add"
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <RiAddCircleLine className="mr-2 h-5 w-5" />
          Add Project
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 text-sm text-center py-2 px-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project._id}
            className="relative group rounded-lg border border-gray-800 bg-[#1a1f2e] p-6 hover:border-gray-700 transition-colors"
          >
            {project.image && (
              <div className="mb-4">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={500}
                  height={300}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <h3 className="text-lg font-medium text-white mb-2">{project.title}</h3>
            <p className="text-sm text-[#94a3b8] mb-4 line-clamp-2">{project.description}</p>
            
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-600/10 text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {project.skills && project.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-600/10 text-green-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View Project →
              </a>
            )}

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <span title={`Created by ${project.createdBy.email || 'Admin'}`}>
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  {project.updatedAt !== project.createdAt && (
                    <span title={`Last updated on ${new Date(project.updatedAt).toLocaleString()}`}>
                      • Updated
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/project/${project._id}/edit`}
                    className="p-1 text-[#94a3b8] hover:text-white transition-colors"
                  >
                    <RiEditLine className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-[#1a1f2e] rounded-lg border border-gray-800">
            <p className="text-[#94a3b8]">No product projects found.</p>
            <Link
              href="/admin/project/add"
              className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              <RiAddCircleLine className="mr-2 h-5 w-5" />
              Add Your First Project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 