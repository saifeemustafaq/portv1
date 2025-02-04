'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { RiUploadCloud2Line, RiCloseLine } from 'react-icons/ri';
import ImageCropper from '../../../components/ImageCropper';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRandomPlaceholder } from '../../../utils/placeholderIcons';
import { ProjectCategory } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';

// Custom error classes
class ProjectFormError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ProjectFormError';
  }
}

class ValidationError extends ProjectFormError {
  constructor(message: string, field?: string) {
    super(message, field);
    this.name = 'ValidationError';
  }
}

class NetworkError extends ProjectFormError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_TAGS = 5;
const MAX_SKILLS = 5;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

interface ProjectData {
  title: string;
  description: string;
  category: ProjectCategory;
  link?: string;
  image?: string;
  tags: string[];
  skills: string[];
}

// Type guard for ProjectCategory
function isValidCategory(category: string): category is ProjectCategory {
  return Object.keys(CATEGORY_CONFIG).includes(category);
}

function validateProjectData(data: ProjectData): void {
  if (!data.title.trim()) {
    throw new ValidationError('Title is required', 'title');
  }
  if (data.title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must be ${MAX_TITLE_LENGTH} characters or less`, 'title');
  }
  
  if (!data.description.trim()) {
    throw new ValidationError('Description is required', 'description');
  }
  if (data.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`, 'description');
  }
  
  if (!isValidCategory(data.category)) {
    throw new ValidationError('Invalid category selected', 'category');
  }
  
  if (data.link && !URL_REGEX.test(data.link)) {
    throw new ValidationError('Invalid project URL format', 'link');
  }
  
  if (data.tags.length > MAX_TAGS) {
    throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`, 'tags');
  }
  
  if (data.skills.length > MAX_SKILLS) {
    throw new ValidationError(`Maximum ${MAX_SKILLS} skills allowed`, 'skills');
  }
}

function ProjectForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');

  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();

      const response = await fetch(`/api/admin/project/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new NetworkError(data.message || 'Failed to fetch project');
      }

      const project = data.project;
      setIsEditMode(true);
      
      // Pre-fill form data
      if (formRef.current) {
        const titleInput = formRef.current.querySelector<HTMLInputElement>('[name="title"]');
        const descriptionInput = formRef.current.querySelector<HTMLTextAreaElement>('[name="description"]');
        const linkInput = formRef.current.querySelector<HTMLInputElement>('[name="link"]');
        const categorySelect = formRef.current.querySelector<HTMLSelectElement>('[name="category"]');
        
        if (titleInput) titleInput.value = project.title;
        if (descriptionInput) descriptionInput.value = project.description;
        if (linkInput) linkInput.value = project.link || '';
        if (categorySelect) categorySelect.value = project.category;
      }

      setInitialCategory(project.category);
      setImagePreview(project.image);
      setTags(project.tags || []);
      setSkills(project.skills || []);
    } catch (error) {
      if (error instanceof NetworkError) {
        setError(error.message);
      } else {
        setError('Failed to fetch project data. Please try again.');
      }
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      void fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > MAX_IMAGE_SIZE) {
        throw new ValidationError('Image size should be less than 5MB', 'image');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError('Only JPEG, PNG, and GIF images are allowed', 'image');
      }

      setSelectedFile(file);
      setShowCropper(true);
      clearErrors();
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldError(error.field || 'image', error.message);
      } else {
        setError('Failed to process image. Please try again.');
      }
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    setImagePreview(croppedImage);
    setShowCropper(false);
    clearErrors();
  };

  const handleImageError = (error: string) => {
    setFieldError('image', error);
    setShowCropper(false);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) {
        try {
          if (tags.length >= MAX_TAGS) {
            throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`, 'tags');
          }
          setTags([...tags, newTag]);
          setTagInput('');
          clearErrors();
        } catch (error) {
          if (error instanceof ValidationError) {
            setFieldError(error.field || 'tags', error.message);
          }
        }
      }
    } else {
      setTagInput(value);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        try {
          if (tags.length >= MAX_TAGS) {
            throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`, 'tags');
          }
          setTags([...tags, newTag]);
          setTagInput('');
          clearErrors();
        } catch (error) {
          if (error instanceof ValidationError) {
            setFieldError(error.field || 'tags', error.message);
          }
        }
      }
    } else if (e.key === 'Backspace' && !tagInput) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
      clearErrors();
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
    clearErrors();
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const newSkill = value.slice(0, -1).trim();
      if (newSkill && !skills.includes(newSkill)) {
        try {
          if (skills.length >= MAX_SKILLS) {
            throw new ValidationError(`Maximum ${MAX_SKILLS} skills allowed`, 'skills');
          }
          setSkills([...skills, newSkill]);
          setSkillInput('');
          clearErrors();
        } catch (error) {
          if (error instanceof ValidationError) {
            setFieldError(error.field || 'skills', error.message);
          }
        }
      }
    } else {
      setSkillInput(value);
    }
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !skills.includes(newSkill)) {
        try {
          if (skills.length >= MAX_SKILLS) {
            throw new ValidationError(`Maximum ${MAX_SKILLS} skills allowed`, 'skills');
          }
          setSkills([...skills, newSkill]);
          setSkillInput('');
          clearErrors();
        } catch (error) {
          if (error instanceof ValidationError) {
            setFieldError(error.field || 'skills', error.message);
          }
        }
      }
    } else if (e.key === 'Backspace' && !skillInput) {
      e.preventDefault();
      setSkills(skills.slice(0, -1));
      clearErrors();
    }
  };

  const handleSkillDelete = (skillToDelete: string) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const projectData: ProjectData = {
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string).trim(),
        category: formData.get('category') as ProjectCategory,
        link: (formData.get('link') as string)?.trim() || undefined,
        image: imagePreview || getRandomPlaceholder(formData.get('category') as ProjectCategory),
        tags,
        skills,
      };

      // Validate project data
      validateProjectData(projectData);

      const url = isEditMode ? `/api/admin/project/${projectId}` : '/api/admin/project';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new NetworkError('Your session has expired. Please log in again.');
        }
        throw new NetworkError(data.message || `Failed to ${isEditMode ? 'update' : 'add'} project`);
      }

      setSuccess(`Project ${isEditMode ? 'updated' : 'added'} successfully`);
      
      if (!isEditMode) {
        formRef.current?.reset();
        setImagePreview(null);
        setTags([]);
        setSkills([]);
      }
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldError(error.field || 'form', error.message);
      } else if (error instanceof NetworkError) {
        setError(error.message);
      } else {
        setError(`An error occurred while ${isEditMode ? 'updating' : 'saving'} the project. Please try again.`);
      }
      console.error('Error submitting project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-lg text-[#94a3b8]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white serif">
          {isEditMode ? 'Edit Project' : 'Add New Project'}
        </h1>
        <p className="mt-2 text-[#94a3b8]">
          {isEditMode ? 'Update your project details' : 'Create a new project to showcase in your portfolio'}
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm text-center py-2 px-4 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 text-green-400 text-sm text-center py-2 px-4 rounded-lg border border-green-500/20">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.category ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            defaultValue={initialCategory || ''}
          >
            <option value="" disabled>Select a category</option>
            <option value="product" className="text-product">Product</option>
            <option value="software" className="text-software">Software</option>
            <option value="content" className="text-content">Content</option>
            <option value="innovation" className="text-innovation">Innovation</option>
          </select>
          {fieldErrors.category && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.category}</p>
          )}
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Project Image <span className="text-[#94a3b8]">(Square image recommended)</span>
          </label>
          <div className={`mt-1 flex justify-center rounded-lg border border-dashed ${
            fieldErrors.image ? 'border-red-500' : 'border-gray-700'
          } px-6 py-10`}>
            <div className="text-center">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="mx-auto h-32 w-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      clearErrors();
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <RiUploadCloud2Line className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-400">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer rounded-md bg-transparent font-semibold text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-300"
                    >
                      <span>Upload an image</span>
                      <input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
            </div>
          </div>
          {fieldErrors.image && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.image}</p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Title <span className="text-red-400">*</span>{' '}
            <span className="text-[#94a3b8]">(max {MAX_TITLE_LENGTH} characters)</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={MAX_TITLE_LENGTH}
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.title ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Enter project title"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Description <span className="text-red-400">*</span>{' '}
            <span className="text-[#94a3b8]">(max {MAX_DESCRIPTION_LENGTH} characters)</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={4}
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.description ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Describe your project"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Tags <span className="text-[#94a3b8]">(max {MAX_TAGS}, press comma or enter to add)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.tags ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Type and press comma or enter to add tags..."
          />
          {fieldErrors.tags && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.tags}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-600/10 text-blue-400"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagDelete(tag)}
                    className="ml-1 hover:text-blue-300"
                  >
                    <RiCloseLine className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Skills/Tech <span className="text-[#94a3b8]">(max {MAX_SKILLS}, press comma or enter to add)</span>
          </label>
          <input
            id="skills"
            name="skills"
            type="text"
            value={skillInput}
            onChange={handleSkillInputChange}
            onKeyDown={handleSkillInputKeyDown}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.skills ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Type and press comma or enter to add skills..."
          />
          {fieldErrors.skills && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.skills}</p>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-600/10 text-green-400"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleSkillDelete(skill)}
                    className="ml-1 hover:text-green-300"
                  >
                    <RiCloseLine className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Project Link
          </label>
          <input
            id="link"
            name="link"
            type="url"
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.link ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="https://..."
          />
          {fieldErrors.link && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.link}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? 'Updating Project...' : 'Adding Project...') : (isEditMode ? 'Update Project' : 'Add Project')}
          </button>
        </div>
      </form>

      {showCropper && selectedFile && (
        <ImageCropper
          imageFile={selectedFile}
          onCroppedImage={handleCroppedImage}
          onCancel={() => setShowCropper(false)}
          onError={handleImageError}
        />
      )}
    </div>
  );
}

export default function ProjectFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px] p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project form...</p>
        </div>
      </div>
    }>
      <ProjectForm />
    </Suspense>
  );
} 