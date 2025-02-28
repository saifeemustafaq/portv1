'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { RiEditLine, RiSaveLine, RiAddLine, RiDeleteBin6Line } from 'react-icons/ri';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { logClientError, logClientAction } from '@/app/utils/clientLogger';

interface BasicInfo {
  name: string;
  yearsOfExperience: string;
  phone: string;
  email: string;
  profilePicture?: {
    relativePath: string;
    original: string;
    thumbnail: string;
  };
}

interface WorkExperience {
  _id?: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isPresent: boolean;
  description: string;
  website: string;
  companyLogo?: {
    relativePath: string;
    original: string;
    thumbnail: string;
  };
}

function BasicInfoContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    yearsOfExperience: '',
    phone: '',
    email: ''
  });
  const [editedInfo, setEditedInfo] = useState<BasicInfo>(basicInfo);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [newExperience, setNewExperience] = useState<WorkExperience>({
    companyName: '',
    position: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isPresent: false,
    description: '',
    website: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editedExperience, setEditedExperience] = useState<WorkExperience | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBasicInfo();
    fetchWorkExperiences();
  }, []);

  const fetchBasicInfo = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch('/api/admin/basic-info');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch basic info' }));
        throw new Error(errorData.message || 'Failed to fetch basic info');
      }
      const data = await response.json();
      if (data && typeof data === 'object') {
        setBasicInfo(data);
        setEditedInfo(data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch basic info';
      console.error('Error fetching basic info:', error);
      setError(errorMessage);
      logClientError('system', 'Failed to fetch basic info', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkExperiences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/work-experience');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch work experiences' }));
        throw new Error(errorData.message || 'Failed to fetch work experiences');
      }
      const data = await response.json();
      setWorkExperiences(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch work experiences';
      console.error('Error fetching work experiences:', error);
      logClientError('system', 'Failed to fetch work experiences', error instanceof Error ? error : new Error(String(error)));
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('name', editedInfo.name);
      formData.append('yearsOfExperience', editedInfo.yearsOfExperience);
      formData.append('phone', editedInfo.phone);
      formData.append('email', editedInfo.email);
      
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
      }

      const response = await fetch('/api/admin/basic-info', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update basic info' }));
        throw new Error(errorData.message || 'Failed to update basic info');
      }

      const updatedInfo = await response.json();
      setBasicInfo(updatedInfo);
      setIsEditing(false);
      setProfilePictureFile(null);
      setToast({ message: 'Basic info updated successfully', type: 'success' });
      logClientAction('Basic info updated successfully', { status: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update basic info';
      console.error('Error saving basic info:', error);
      logClientError('system', 'Failed to update basic info', error instanceof Error ? error : new Error(String(error)));
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo(basicInfo);
    setIsEditing(false);
  };

  const handleAddExperience = async () => {
    try {
      setIsLoading(true);
      
      if (!logoFile) {
        throw new Error('Company logo is required');
      }

      const formData = new FormData();
      formData.append('companyName', newExperience.companyName);
      formData.append('position', newExperience.position);
      formData.append('startDate', newExperience.startDate);
      if (!newExperience.isPresent && newExperience.endDate) {
        formData.append('endDate', newExperience.endDate);
      }
      formData.append('isPresent', String(newExperience.isPresent));
      formData.append('description', newExperience.description);
      formData.append('website', newExperience.website);
      formData.append('logo', logoFile);

      const response = await fetch('/api/admin/work-experience', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add work experience' }));
        throw new Error(errorData.message || 'Failed to add work experience');
      }

      await fetchWorkExperiences();
      setIsAddingExperience(false);
      setNewExperience({
        companyName: '',
        position: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isPresent: false,
        description: '',
        website: ''
      });
      setLogoFile(null);
      setToast({ message: 'Work experience added successfully', type: 'success' });
      logClientAction('Work experience added', { company: newExperience.companyName });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add work experience';
      console.error('Error adding work experience:', error);
      logClientError('system', 'Failed to add work experience', error instanceof Error ? error : new Error(String(error)));
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/work-experience?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete work experience' }));
        throw new Error(errorData.message || 'Failed to delete work experience');
      }

      await fetchWorkExperiences();
      setToast({ message: 'Work experience deleted successfully', type: 'success' });
      logClientAction('Work experience deleted', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete work experience';
      console.error('Error deleting work experience:', error);
      logClientError('system', 'Failed to delete work experience', error instanceof Error ? error : new Error(String(error)));
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExperience = async () => {
    try {
      if (!editedExperience?._id) return;
      
      setIsLoading(true);
      const formData = new FormData();
      formData.append('companyName', editedExperience.companyName);
      formData.append('position', editedExperience.position);
      formData.append('startDate', editedExperience.startDate);
      if (!editedExperience.isPresent && editedExperience.endDate) {
        formData.append('endDate', editedExperience.endDate);
      }
      formData.append('isPresent', String(editedExperience.isPresent));
      formData.append('description', editedExperience.description);
      formData.append('website', editedExperience.website);
      if (editLogoFile) {
        formData.append('logo', editLogoFile);
      }

      const response = await fetch(`/api/admin/work-experience?id=${editedExperience._id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update work experience' }));
        throw new Error(errorData.message || 'Failed to update work experience');
      }

      await fetchWorkExperiences();
      setEditingExperience(null);
      setEditedExperience(null);
      setEditLogoFile(null);
      setToast({ message: 'Work experience updated successfully', type: 'success' });
      logClientAction('Work experience updated', { id: editedExperience._id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update work experience';
      console.error('Error updating work experience:', error);
      logClientError('system', 'Failed to update work experience', error instanceof Error ? error : new Error(String(error)));
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg ${
          toast.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {toast.message}
          <button 
            onClick={() => setToast(null)}
            className="ml-2 text-sm opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
      <div className="glass-panel rounded-lg p-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Basic Information
        </h1>
        <p className="mt-2 text-zinc-300">
          Manage your personal information and contact details.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Information</h2>
        <div className="rounded-lg bg-[#1a1f2e] border border-gray-800 p-6">
          <div className="space-y-4">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <div className="relative w-24 h-24">
                {basicInfo.profilePicture ? (
                  <img
                    src={basicInfo.profilePicture.thumbnail}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">?</span>
                  </div>
                )}
                {isEditing && (
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    <RiEditLine className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      id="profile-picture"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfilePictureFile(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              {profilePictureFile && (
                <span className="text-sm text-green-400">
                  New image selected: {profilePictureFile.name}
                </span>
              )}
            </div>
            
            {isEditing ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editedInfo.name}
                      onChange={(e) => setEditedInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="text"
                      value={editedInfo.yearsOfExperience}
                      onChange={(e) => setEditedInfo(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                      className="w-full bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editedInfo.phone}
                      onChange={(e) => setEditedInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editedInfo.email}
                      onChange={(e) => setEditedInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Name
                  </label>
                  <p className="text-white">{basicInfo.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Years of Experience
                  </label>
                  <p className="text-white">{basicInfo.yearsOfExperience || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Phone Number
                  </label>
                  <p className="text-white">{basicInfo.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-white">{basicInfo.email || 'Not set'}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-800">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700/20 text-gray-300 hover:bg-gray-700/30 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-300"
                  >
                    <RiSaveLine className={`h-4 w-4 ${isLoading ? 'opacity-50' : ''}`} />
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-gray-700/20 text-gray-300 hover:bg-gray-700/30 transition-all duration-300"
                >
                  <RiEditLine className="h-4 w-4" />
                  Edit Information
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work Experience Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Work Experience</h2>
        <div className="rounded-lg bg-[#1a1f2e] border border-gray-800 p-6">
          {/* Existing Work Experiences */}
          <div className="space-y-6">
            {workExperiences.map((exp) => (
              <div key={exp._id} className="rounded-lg bg-[#1a1f2e] border border-gray-800 p-6 relative">
                {editingExperience === exp._id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Company Logo
                      </label>
                      <div className="flex items-center gap-4">
                        {exp.companyLogo && (
                          <img 
                            src={exp.companyLogo.thumbnail} 
                            alt={`Current ${exp.companyName} logo`}
                            className="w-16 h-16 object-contain rounded-lg bg-white/5 p-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditLogoFile(e.target.files?.[0] || null)}
                          className="flex-1 bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={editedExperience?.companyName || ''}
                        onChange={(e) => setEditedExperience(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                        className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Company Website
                      </label>
                      <input
                        type="url"
                        value={editedExperience?.website || ''}
                        onChange={(e) => setEditedExperience(prev => prev ? { ...prev, website: e.target.value } : null)}
                        className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={editedExperience?.position || ''}
                        onChange={(e) => setEditedExperience(prev => prev ? { ...prev, position: e.target.value } : null)}
                        className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={editedExperience?.startDate || ''}
                          onChange={(e) => setEditedExperience(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                          className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {!editedExperience?.isPresent && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={editedExperience?.endDate || ''}
                            onChange={(e) => setEditedExperience(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                            className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-400">
                        <input
                          type="checkbox"
                          checked={editedExperience?.isPresent || false}
                          onChange={(e) => setEditedExperience(prev => prev ? {
                            ...prev,
                            isPresent: e.target.checked,
                            endDate: e.target.checked ? undefined : prev.endDate
                          } : null)}
                          className="rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-[#1a1f2e]"
                        />
                        <span>Present Position</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Description (supports markdown)
                      </label>
                      <textarea
                        value={editedExperience?.description || ''}
                        onChange={(e) => setEditedExperience(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                        className="w-full bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        placeholder="Enter job description (markdown supported)"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => {
                          setEditingExperience(null);
                          setEditedExperience(null);
                          setEditLogoFile(null);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700/20 text-gray-300 hover:bg-gray-700/30 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditExperience}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-300"
                      >
                        <RiSaveLine className={`h-4 w-4 ${isLoading ? 'opacity-50' : ''}`} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        {exp.companyLogo && (
                          <img 
                            src={exp.companyLogo.thumbnail} 
                            alt={exp.companyName} 
                            className="w-12 h-12 rounded-lg object-cover" 
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-white">{exp.position}</h3>
                          <p className="text-gray-400">{exp.companyName}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {new Date(exp.startDate).toLocaleDateString()} - {exp.isPresent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                      </div>
                      <div className="mt-4 text-gray-300 prose prose-invert max-w-none">
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{exp.description}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => {
                          if (exp._id) {
                            setEditingExperience(exp._id);
                            setEditedExperience({
                              ...exp,
                              startDate: new Date(exp.startDate).toISOString().split('T')[0],
                              endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : undefined
                            });
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <RiEditLine className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => exp._id && handleDeleteExperience(exp._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <RiDeleteBin6Line className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Experience Form */}
          {isAddingExperience ? (
            <div className="rounded-lg bg-[#1a1f2e] border border-gray-800 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Company Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#0f1117] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newExperience.companyName}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={newExperience.position}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Company Website
                </label>
                <input
                  type="url"
                  value={newExperience.website}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={newExperience.description}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newExperience.startDate || ''}
                    onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {!newExperience.isPresent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newExperience.endDate || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-[#1a1f2e] text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400">
                  <input
                    type="checkbox"
                    checked={newExperience.isPresent}
                    onChange={(e) => setNewExperience(prev => ({ 
                      ...prev, 
                      isPresent: e.target.checked,
                      endDate: e.target.checked ? undefined : prev.endDate 
                    }))}
                    className="rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-[#1a1f2e]"
                  />
                  <span>Present Position</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsAddingExperience(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700/20 text-gray-300 hover:bg-gray-700/30 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExperience}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-300"
                >
                  <RiSaveLine className={`h-4 w-4 ${isLoading ? 'opacity-50' : ''}`} />
                  Save Experience
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <button
                onClick={() => setIsAddingExperience(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-300"
              >
                <RiAddLine className="h-4 w-4" />
                Add Work Experience
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BasicInfoPage() {
  return (
    <ErrorBoundary>
      <div className="error-boundary-container">
        <BasicInfoContent />
      </div>
    </ErrorBoundary>
  );
} 