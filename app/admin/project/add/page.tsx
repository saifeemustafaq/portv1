'use client';

import { useState, useEffect, Suspense } from 'react';
import { RiUploadCloud2Line, RiCloseLine } from 'react-icons/ri';
import ImageCropper from '../../../components/ImageCropper';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryType } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { uploadImage } from '../../../utils/azureStorage';

// Simple form interface
interface ProjectFormData {
  title: string;
  description: string;
  category: CategoryType;
  link?: string;
  image?: {
    original: string;
    thumbnail: string;
  };
  tags: string[];
  skills: string[];
}

// Separate client component for form content
function ProjectFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: Object.keys(CATEGORY_CONFIG)[0] as CategoryType,
    tags: [],
    skills: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch project data if in edit mode
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/project/${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        
        const { project } = await response.json();

        // Extract the category string from the category object or string
        const categoryValue = typeof project.category === 'string' 
          ? project.category 
          : project.category.category || Object.keys(CATEGORY_CONFIG)[0];

        setFormData({
          title: project.title,
          description: project.description,
          category: categoryValue as CategoryType,
          link: project.link || '',
          image: project.image,
          tags: project.tags || [],
          skills: project.skills || []
        });
        
        if (project.image) {
          setImagePreview(typeof project.image === 'string' ? project.image : project.image.original);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCroppedImage = async (croppedImage: string) => {
    setImagePreview(croppedImage);
    setShowCropper(false);
    
    try {
      const { originalUrl, thumbnailUrl } = await uploadImage(croppedImage, 'project-image');
      setFormData(prev => ({
        ...prev,
        image: {
          original: originalUrl,
          thumbnail: thumbnailUrl
        }
      }));
    } catch {
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleTagsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    
    const input = e.currentTarget;
    const value = input.value.trim();
    
    if (!value) return;
    if (formData.tags.length >= 5) {
      setError('Maximum 5 tags allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: Array.from(new Set([...prev.tags, value]))
    }));
    input.value = '';
  };

  const handleSkillsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    
    const input = e.currentTarget;
    const value = input.value.trim();
    
    if (!value) return;
    if (formData.skills.length >= 5) {
      setError('Maximum 5 skills allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      skills: Array.from(new Set([...prev.skills, value]))
    }));
    input.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      if (!formData.title.trim()) throw new Error('Title is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.image) throw new Error('Image is required');
      
      const endpoint = projectId ? `/api/admin/project/${projectId}` : '/api/admin/project';
      const method = projectId ? 'PUT' : 'POST';
      
      const requestData = projectId ? {
        ...formData,
        id: projectId
      } : formData;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to save project');
      }
      
      router.push(`/admin/${formData.category}`);
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.title) {
    return <div className="flex justify-center items-center min-h-[50vh]">
      <div className="text-[#94a3b8]">Loading...</div>
    </div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc] mb-6">
        {projectId ? 'Edit Project' : 'Create Project'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-[#1a1f2e] rounded-lg border-2 border-[#2a2f3e] p-8 shadow-lg">
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border-2 border-red-500/20">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter project title"
              className="w-full p-3 bg-[#1a1f2e] border-2 border-[#2a2f3e] rounded-lg text-[#f8fafc] placeholder-[#94a3b8] 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              maxLength={50}
            />
          </div>
          
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter project description"
              className="w-full p-3 bg-[#1a1f2e] border-2 border-[#2a2f3e] rounded-lg text-[#f8fafc] placeholder-[#94a3b8] 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 h-32"
              maxLength={300}
            />
            <span className="text-sm text-[#94a3b8] mt-1">Maximum 300 characters</span>
          </div>
          
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 bg-[#1a1f2e] border-2 border-[#2a2f3e] rounded-lg text-[#f8fafc] 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.title}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Link</label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://your-project-url.com"
              className="w-full p-3 bg-[#1a1f2e] border-2 border-[#2a2f3e] rounded-lg text-[#f8fafc] placeholder-[#94a3b8] 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>
          
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Image *</label>
            <div className="border-2 border-dashed border-[#2a2f3e] rounded-lg p-6 bg-[#1a1f2e]/50">
              {imagePreview ? (
                <div className="relative w-full aspect-video">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-2 bg-[#1a1f2e] rounded-full hover:bg-[#2a2f3e] transition-colors duration-300"
                  >
                    <RiCloseLine className="w-5 h-5 text-[#f8fafc]" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block p-8 text-center">
                  <RiUploadCloud2Line className="mx-auto h-12 w-12 text-[#94a3b8]" />
                  <span className="mt-2 block text-sm text-[#94a3b8]">
                    Click to upload image (max 5MB)
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Tags <span className="text-sm text-[#94a3b8]">(max 5)</span></label>
            <input
              type="text"
              onKeyDown={handleTagsChange}
              placeholder="Type a tag and press Enter"
              className="w-full p-3 bg-[#1a1f2e] border-2 border-[#2a2f3e] rounded-lg text-[#f8fafc] placeholder-[#94a3b8] 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-[#2a2f3e] text-[#f8fafc] px-3 py-1.5 rounded-full text-sm flex items-center gap-1 border border-[#3a3f4e]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.filter(t => t !== tag)
                    }))}
                    className="hover:text-red-400 transition-colors duration-300"
                  >
                    <RiCloseLine className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="block text-[#f8fafc] font-medium mb-2">Project Skills <span className="text-sm text-[#94a3b8]">(max 5)</span></label>
            <input
              type="text"
              onKeyDown={handleSkillsChange}
              placeholder="Type a skill and press Enter"
              className="w-full p-3 bg-[#1a1f2e] border-2 border-[#2a2f3e] rounded-lg text-[#f8fafc] placeholder-[#94a3b8] 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills.map(skill => (
                <span
                  key={skill}
                  className="bg-[#2a2f3e] text-[#f8fafc] px-3 py-1.5 rounded-full text-sm flex items-center gap-1 border border-[#3a3f4e]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      skills: prev.skills.filter(s => s !== skill)
                    }))}
                    className="hover:text-red-400 transition-colors duration-300"
                  >
                    <RiCloseLine className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-[#f8fafc] p-4 rounded-lg font-medium hover:bg-blue-600 
            disabled:opacity-50 disabled:hover:bg-blue-500 transition-all duration-300 mt-8 border-2 border-blue-600"
        >
          {loading ? 'Saving...' : (projectId ? 'Update Project' : 'Create Project')}
        </button>

        {showCropper && selectedFile && (
          <ImageCropper
            imageFile={selectedFile}
            onCroppedImage={handleCroppedImage}
            onCancel={() => setShowCropper(false)}
            onError={error => setError(error)}
          />
        )}
      </form>
    </>
  );
}

// Main form component with Suspense boundary
function ProjectForm() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ProjectFormContent />
    </Suspense>
  );
}

export default function ProjectFormPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] p-6">
      <div className="max-w-4xl mx-auto">
        <ProjectForm />
      </div>
    </div>
  );
} 