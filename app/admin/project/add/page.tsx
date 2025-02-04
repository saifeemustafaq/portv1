'use client';

import { useState, useRef } from 'react';
import { RiUploadCloud2Line, RiCloseLine } from 'react-icons/ri';
import ImageCropper from '../../../components/ImageCropper';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getRandomPlaceholder } from '../../../utils/placeholderIcons';

export default function AddProjectPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setShowCropper(true);
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    setImagePreview(croppedImage);
    setShowCropper(false);
    setError('');
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) {
        if (tags.length >= 5) {
          setError('Maximum 5 tags allowed');
          return;
        }
        setTags([...tags, newTag]);
        setTagInput('');
      }
    } else {
      setTagInput(value);
    }
    setError('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        if (tags.length >= 5) {
          setError('Maximum 5 tags allowed');
          return;
        }
        setTags([...tags, newTag]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const newSkill = value.slice(0, -1).trim();
      if (newSkill && !skills.includes(newSkill)) {
        if (skills.length >= 5) {
          setError('Maximum 5 skills allowed');
          return;
        }
        setSkills([...skills, newSkill]);
        setSkillInput('');
      }
    } else {
      setSkillInput(value);
    }
    setError('');
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !skills.includes(newSkill)) {
        if (skills.length >= 5) {
          setError('Maximum 5 skills allowed');
          return;
        }
        setSkills([...skills, newSkill]);
        setSkillInput('');
      }
    } else if (e.key === 'Backspace' && !skillInput) {
      e.preventDefault();
      setSkills(skills.slice(0, -1));
    }
  };

  const handleSkillDelete = (skillToDelete: string) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as 'product' | 'software' | 'content';

      // Validate title length
      if (title.length > 50) {
        throw new Error('Title must be 50 characters or less');
      }

      // Validate description length
      if (description.length > 300) {
        throw new Error('Description must be 300 characters or less');
      }

      const projectData = {
        title,
        description,
        category,
        link: formData.get('link'),
        image: imagePreview || getRandomPlaceholder(category),
        tags,
        skills,
      };

      const response = await fetch('/api/admin/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add project');
      }

      setSuccess('Project added successfully');
      formRef.current?.reset();
      setImagePreview(null);
      setTags([]);
      setSkills([]);
      router.push('/admin/dashboard');
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the project';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white serif">
          Add New Project
        </h1>
        <p className="mt-2 text-[#94a3b8]">
          Create a new project to showcase in your portfolio
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
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            className="relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          >
            <option value="">Select a category</option>
            <option value="product">Product</option>
            <option value="software">Software</option>
            <option value="content">Content</option>
          </select>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Project Image <span className="text-[#94a3b8]">(Square image recommended)</span>
          </label>
          <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-700 px-6 py-10">
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
                    onClick={() => setImagePreview(null)}
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
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Title <span className="text-[#94a3b8]">(max 50 characters)</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={50}
            className="relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            placeholder="Enter project title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Description <span className="text-[#94a3b8]">(max 300 characters)</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={300}
            rows={4}
            className="relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            placeholder="Describe your project"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Tags <span className="text-[#94a3b8]">(max 5, press comma or enter to add)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            className="relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            placeholder="Type and press comma or enter to add tags..."
          />
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
            Skills/Tech <span className="text-[#94a3b8]">(max 5, press comma or enter to add)</span>
          </label>
          <input
            id="skills"
            name="skills"
            type="text"
            value={skillInput}
            onChange={handleSkillInputChange}
            onKeyDown={handleSkillInputKeyDown}
            className="relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            placeholder="Type and press comma or enter to add skills..."
          />
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
            className="relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            placeholder="https://..."
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Project...' : 'Add Project'}
          </button>
        </div>
      </form>

      {showCropper && selectedFile && (
        <ImageCropper
          imageFile={selectedFile}
          onCroppedImage={handleCroppedImage}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
} 