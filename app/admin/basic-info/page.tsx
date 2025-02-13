'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { RiEditLine, RiSaveLine, RiAddLine, RiDeleteBin6Line } from 'react-icons/ri';

interface BasicInfo {
  name: string;
  yearsOfExperience: string;
  phone: string;
  email: string;
}

interface WorkExperience {
  _id?: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isPresent: boolean;
  description: string;
}

function BasicInfoContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    description: ''
  });

  useEffect(() => {
    fetchBasicInfo();
    fetchWorkExperiences();
  }, []);

  const fetchBasicInfo = async () => {
    try {
      const response = await fetch('/api/admin/basic-info');
      if (response.ok) {
        const data = await response.json();
        setBasicInfo(data);
        setEditedInfo(data);
      }
    } catch (error) {
      console.error('Error fetching basic info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkExperiences = async () => {
    try {
      const response = await fetch('/api/admin/work-experience');
      if (response.ok) {
        const data = await response.json();
        setWorkExperiences(data);
      }
    } catch (error) {
      console.error('Error fetching work experiences:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/basic-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedInfo),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setBasicInfo(editedInfo);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
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
      
      const experienceData = {
        ...newExperience,
        endDate: newExperience.isPresent ? undefined : newExperience.endDate
      };

      const response = await fetch('/api/admin/work-experience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experienceData),
      });

      if (!response.ok) {
        throw new Error('Failed to add work experience');
      }

      await fetchWorkExperiences();
      setIsAddingExperience(false);
      setNewExperience({
        companyName: '',
        position: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isPresent: false,
        description: ''
      });
    } catch (error) {
      console.error('Error adding work experience:', error);
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
        throw new Error('Failed to delete work experience');
      }

      await fetchWorkExperiences();
    } catch (error) {
      console.error('Error deleting work experience:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
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
              <div key={exp._id} className="p-4 bg-[#0f1117] rounded-lg border border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white">{exp.position}</h3>
                    <p className="text-gray-400">{exp.companyName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(exp.startDate).toLocaleDateString()} - {
                        exp.isPresent ? 'Present' : 
                        exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''
                      }
                    </p>
                    <p className="mt-2 text-gray-300">{exp.description}</p>
                  </div>
                  <button
                    onClick={() => exp._id && handleDeleteExperience(exp._id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <RiDeleteBin6Line className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Experience Form */}
          {isAddingExperience ? (
            <div className="mt-6 p-4 bg-[#0f1117] rounded-lg border border-gray-800">
              <div className="space-y-4">
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
      <BasicInfoContent />
    </ErrorBoundary>
  );
} 