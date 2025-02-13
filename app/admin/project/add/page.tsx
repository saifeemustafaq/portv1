'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { RiUploadCloud2Line, RiCloseLine } from 'react-icons/ri';
import ImageCropper from '../../../components/ImageCropper';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRandomPlaceholder } from '../../../utils/placeholderIcons';
import { CategoryType } from '@/types/projects';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { useCategories } from '@/app/hooks/useCategories';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';
import { uploadImage } from '../../../utils/azureStorage';

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

interface CategoryConfig {
  color: string;
  enabled: boolean;
  title: string;
}

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

function ProjectForm() {
  const { categories, loading: categoriesLoading, error: categoriesError, getEnabledCategories } = useCategories();
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

    const formData = new FormData(e.currentTarget);
    const categoryValue = formData.get('category') as string;
    
    try {
      // Validate the category is a valid CategoryType
      if (!isValidCategory(categoryValue)) {
        throw new ValidationError('Invalid category selected', 'category');
      }

      let imageUrls;

      // If we have an image preview
      if (imagePreview) {
        // If it's a data URL (new image or placeholder), process it
        if (imagePreview.startsWith('data:image')) {
          // Convert base64 to file
          const base64Data = imagePreview.replace(/^data:image\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          
          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

          // Create form data for upload
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          // Upload to server
          const uploadResponse = await fetch('/api/admin/upload', {
            method: 'POST',
            body: uploadFormData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const uploadData = await uploadResponse.json();
          imageUrls = uploadData.urls;
        } else {
          // If it's a URL (existing image), keep it as is
          imageUrls = {
            original: imagePreview,
            thumbnail: imagePreview.replace('/originals/', '/thumbnails/')
          };
        }
      } else {
        // If no image, clear the preview
        setImagePreview(null);
      }

      const projectData: ProjectFormData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: categoryValue as CategoryType,
        link: formData.get('link') as string || undefined,
        image: imageUrls,
        tags,
        skills
      };

      // Log the data being sent for debugging
      console.log('Submitting project data:', {
        ...projectData,
        imageUrls
      });

      // Validate the data
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

      const data = await response.json();

      if (!response.ok) {
        throw new NetworkError(data.message || 'Failed to save project');
      }

      setSuccess('Project saved successfully!');
      router.push('/admin/dashboard');
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldError(error.field || 'form', error.message);
      } else if (error instanceof NetworkError) {
        setError(error.message);
      } else {
        setError('Failed to save project. Please try again.');
      }
      console.error('Error saving project:', error);
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
      <div className="flex items-center justify-center h-40">
        <div className="text-red-400">Failed to load categories. Please try again later.</div>
      </div>
    );
  }

  const enabledCategories = getEnabledCategories();

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
              .filter(([_, config]) => config.enabled)
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
                    onError={(e) => {
                      console.error('Image preview failed to load:', imagePreview);
                      // Only clear preview if it's not a data URL (placeholder)
                      if (!imagePreview.startsWith('data:')) {
                        setImagePreview(null);
                        setFieldError('image', 'Failed to load image preview');
                      }
                    }}
                    // Allow data URLs for placeholders
                    unoptimized={imagePreview.startsWith('data:')}
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