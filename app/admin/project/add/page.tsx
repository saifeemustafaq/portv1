'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { RiUploadCloud2Line, RiCloseLine, RiRefreshLine } from 'react-icons/ri';
import ImageCropper from '../../../components/ImageCropper';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryType } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { useCategories } from '@/app/hooks/useCategories';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';
import { uploadImage } from '../../../utils/azureStorage';
import { logClientError, logClientAction } from '@/app/utils/clientLogger';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

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
const MAX_RETRIES = 3;

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

function isValidCategory(value: string): value is CategoryType {
  return Object.keys(CATEGORY_CONFIG).includes(value);
}

function validateProjectData(data: ProjectFormData): void {
  if (!data.title.trim()) {
    throw new ValidationError('Title is required', 'title');
  }

  if (data.title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must be less than ${MAX_TITLE_LENGTH} characters`, 'title');
  }

  if (!data.description.trim()) {
    throw new ValidationError('Description is required', 'description');
  }

  if (data.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`, 'description');
  }

  if (!Object.keys(CATEGORY_CONFIG).includes(data.category)) {
    throw new ValidationError('Invalid category selected', 'category');
  }

  if (!data.image || !data.image.original || !data.image.thumbnail) {
    throw new ValidationError('Project image is required', 'image');
  }

  if (data.link && !URL_REGEX.test(data.link)) {
    throw new ValidationError('Invalid URL format', 'link');
  }

  if (data.tags.length > MAX_TAGS) {
    throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`, 'tags');
  }

  if (data.skills.length > MAX_SKILLS) {
    throw new ValidationError(`Maximum ${MAX_SKILLS} skills allowed`, 'skills');
  }
}

// Custom hook for error handling
function useErrorHandler() {
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const clearErrors = useCallback(() => {
    setError('');
    setFieldErrors({});
  }, []);
  
  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
    // Log field errors for debugging
    logClientError('system', `Field validation error: ${field}`, new Error(message));
  }, []);
  
  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    if (error instanceof ValidationError && error.field) {
      setFieldError(error.field, error.message);
      return;
    } else if (error instanceof NetworkError || error instanceof ProjectFormError) {
      setError(error.message);
      logClientError('system', 'Project form error', error);
      return;
    } else if (error instanceof Error) {
      setError(error.message || defaultMessage);
      logClientError('system', 'Unexpected project form error', error);
      return;
    }
    
    // Handle unknown error types
    setError(defaultMessage);
    logClientError('system', 'Unknown project form error', new Error(String(error)));
  }, [setFieldError]);
  
  return {
    error,
    fieldErrors,
    clearErrors,
    setFieldError,
    handleError
  };
}

function ProjectForm() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [loading, setLoading] = useState(false);
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
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  
  // Use the custom error handling hook
  const { error, fieldErrors, clearErrors, setFieldError, handleError } = useErrorHandler();

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();
      setIsRetrying(false);

      const response = await fetch(`/api/admin/project/${projectId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new NetworkError(errorData.message || 'Failed to fetch project');
      }

      const data = await response.json();
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
        if (categorySelect) {
          // Extract category value from populated category field
          let categoryValue;
          if (typeof project.category === 'string') {
            categoryValue = project.category;
          } else if (project.category && typeof project.category === 'object') {
            categoryValue = project.category.category;
          }
          
          if (categoryValue && isValidCategory(categoryValue)) {
            categorySelect.value = categoryValue;
            setInitialCategory(categoryValue);
          }
        }
      }

      // Update initial category state
      let categoryValue;
      if (typeof project.category === 'string') {
        categoryValue = project.category;
      } else if (project.category && typeof project.category === 'object') {
        categoryValue = project.category.category;
      }
      
      if (categoryValue && isValidCategory(categoryValue)) {
        setInitialCategory(categoryValue);
      }

      // Handle image preview based on the image field structure
      if (project.image) {
        if (typeof project.image === 'string') {
          setImagePreview(project.image);
        } else if (typeof project.image === 'object' && project.image.original) {
          setImagePreview(project.image.original);
        } else {
          // If image data is invalid, clear the preview
          setImagePreview(null);
        }
      } else {
        // If no image, clear the preview
        setImagePreview(null);
      }

      setTags(project.tags || []);
      setSkills(project.skills || []);
      
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (error) {
      // Use the error handler
      handleError(error, 'Failed to fetch project data. Please try again.');
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearErrors, handleError]);

  useEffect(() => {
    if (projectId) {
      void fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setIsRetrying(true);
      void fetchProjectData();
    } else {
      handleError(
        new NetworkError(`Failed to fetch project data after ${MAX_RETRIES} attempts. Please try again later.`),
        `Failed to fetch project data after ${MAX_RETRIES} attempts. Please try again later.`
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > MAX_IMAGE_SIZE) {
        throw new ValidationError('Image size should be less than 5MB', 'image');
      }

      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError('Only JPEG and PNG images are allowed', 'image');
      }

      setSelectedFile(file);
      setShowCropper(true);
      clearErrors();
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldError(error.field || 'image', error.message);
        logClientError('system', 'Image validation error', error);
      } else if (error instanceof Error) {
        handleError(error, 'Failed to process image. Please try again.');
        logClientError('system', 'Unexpected image processing error', error);
      } else {
        handleError(new Error(String(error)), 'Failed to process image. Please try again.');
      }
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    setCroppedImage(croppedImage);
    setImagePreview(croppedImage);
    setShowCropper(false);
    clearErrors();
  };

  const handleImageError = (error: string) => {
    setFieldError('image', error);
    setShowCropper(false);
    logClientError('system', 'Image cropping error', new Error(error));
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
    setLoading(true);
    setSuccess('');

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const link = formData.get('link') as string;

      // Check if we have a selected file or existing image
      if (!selectedFile && !imagePreview) {
        throw new ValidationError('Project image is required', 'image');
      }

      let imageUrls: { original: string; thumbnail: string } | undefined;

      if (selectedFile && croppedImage) {
        try {
          // Convert base64 data URL to base64 string
          const base64Data = croppedImage.split(',')[1];
          
          // Generate a unique filename
          const timestamp = Date.now();
          const extension = selectedFile.name.split('.').pop() || 'jpg';
          const fileName = `project-${timestamp}.${extension}`;

          const uploadResult = await uploadImage(base64Data, fileName);
          imageUrls = {
            original: uploadResult.originalUrl,
            thumbnail: uploadResult.thumbnailUrl
          };
        } catch (error) {
          if (error instanceof Error) {
            logClientError('system', 'Image upload error', error);
          } else {
            logClientError('system', 'Image upload error', new Error(String(error)));
          }
          throw new NetworkError('Failed to upload image. Please try again.');
        }
      } else if (imagePreview) {
        // If we have an existing image preview but no new file
        imageUrls = {
          original: imagePreview,
          thumbnail: imagePreview
        };
      }

      const projectData: ProjectFormData = {
        title,
        description,
        category: category as CategoryType,
        link: link || undefined,
        image: imageUrls,
        tags,
        skills,
      };

      validateProjectData(projectData);

      const endpoint = projectId ? `/api/admin/project/${projectId}` : '/api/admin/project';
      const method = projectId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new NetworkError(errorData.message || `Failed to ${isEditMode ? 'update' : 'save'} project`);
      }

      // We don't need to store the response data since we're not using it
      await response.json();
      
      // Log successful operation
      logClientAction(`Project ${isEditMode ? 'updated' : 'created'} successfully`, { 
        title: projectData.title,
        category: projectData.category
      });

      setSuccess(`Project ${isEditMode ? 'updated' : 'saved'} successfully!`);
      setTimeout(() => {
        router.push(`/admin/${projectData.category}`);
      }, 1500);
    } catch (error) {
      // Use the error handler
      handleError(error, `Failed to ${isEditMode ? 'update' : 'save'} project. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Add new function to get category style
  const getCategoryStyle = (category: CategoryType) => {
    if (!categories || !categories[category]) {
      return {
        backgroundColor: '#e5e7eb', // Default gray background
        color: '#000000',          // Default black text
        opacity: 1
      };
    }

    const palette = COLOR_PALETTES.find(p => p.id === categories[category].colorPalette);
    const backgroundColor = palette?.colors.primary || '#e5e7eb';
    
    return {
      backgroundColor,
      color: getContrastColor(backgroundColor),
      opacity: categories[category].enabled ? 1 : 0.5
    };
  };

  // Add helper function for contrast color
  const getContrastColor = (hexcolor: string | undefined) => {
    if (!hexcolor || typeof hexcolor !== 'string') {
      return '#000000'; // Default to black if no valid color
    }
    // Convert hex to RGB
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    
    // Check if conversion was successful
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return '#000000'; // Default to black if conversion fails
    }
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-gray-400">Loading categories...</div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-4">
        <div className="text-red-400">Failed to load categories. Please try again later.</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-300 flex items-center gap-2"
        >
          <RiRefreshLine className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // Show error state with retry option for project fetch errors
  if (error && projectId && !isRetrying) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-400 text-center max-w-md">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
        {retryCount < MAX_RETRIES && (
          <button 
            onClick={handleRetry}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-300 flex items-center gap-2"
            disabled={loading}
          >
            <RiRefreshLine className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        )}
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700/20 text-gray-300 hover:bg-gray-700/30 transition-all duration-300"
        >
          Back to Dashboard
        </button>
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

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
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

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            defaultValue={initialCategory}
            style={initialCategory ? getCategoryStyle(initialCategory as CategoryType) : {}}
            onChange={(e) => {
              clearErrors();
              const style = getCategoryStyle(e.target.value as CategoryType);
              e.target.style.backgroundColor = style.backgroundColor || '';
              e.target.style.color = style.color || '';
              e.target.style.opacity = style.opacity?.toString() || '1';
            }}
          >
            <option value="">Select a category</option>
            {Object.entries(categories || {})
              .filter(([, config]) => config.enabled)
              .map(([key, config]) => (
                <option
                  key={key}
                  value={key}
                  style={getCategoryStyle(key as CategoryType)}
                  disabled={!config.enabled}
                >
                  {config.title}
                </option>
              ))}
          </select>
          {fieldErrors.category && (
            <p className="text-sm text-red-500">{fieldErrors.category}</p>
          )}
          {categoriesError && (
            <p className="text-sm text-red-500">Failed to load categories. Please try again.</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[#f8fafc] font-medium">
            Project Image <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg border-[#2a2f3e] relative">
            {showCropper && selectedFile ? (
              <ImageCropper
                imageFile={selectedFile}
                onCroppedImage={handleCroppedImage}
                onError={handleImageError}
                onCancel={() => {
                  setShowCropper(false);
                  setSelectedFile(null);
                }}
              />
            ) : imagePreview ? (
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="Project preview"
                  width={300}
                  height={200}
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                >
                  <RiCloseLine className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                <div className="flex flex-col items-center">
                  <RiUploadCloud2Line className="w-12 h-12 text-[#94a3b8]" />
                  <div className="flex text-sm text-[#94a3b8]">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-[#3b82f6] hover:text-[#60a5fa] focus-within:outline-none"
                    >
                      <span>Upload an image</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleImageChange}
                        accept="image/jpeg,image/png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-[#94a3b8]">PNG or JPG up to 5MB</p>
                </div>
              </div>
            )}
          </div>
          {fieldErrors.image && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.image}</p>
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
    </div>
  );
}

// Custom ErrorBoundary wrapper with fallback UI
function ProjectFormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary name="ProjectForm">
      <div className="relative">
        {children}
      </div>
    </ErrorBoundary>
  );
}

export default function ProjectFormPage() {
  return (
    <ProjectFormErrorBoundary>
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
    </ProjectFormErrorBoundary>
  );
} 