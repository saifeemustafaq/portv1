'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { RiEditLine, RiSaveLine } from 'react-icons/ri';

interface BasicInfo {
  name: string;
  yearsOfExperience: string;
  phone: string;
  email: string;
}

function BasicInfoContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: 'Mustafa Saifee',
    yearsOfExperience: '3+',
    phone: '+1 650 439 6380',
    email: 'msaifee@andrew.cmu.edu'
  });
  const [editedInfo, setEditedInfo] = useState<BasicInfo>(basicInfo);

  useEffect(() => {
    fetchBasicInfo();
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
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo(basicInfo);
    setIsEditing(false);
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