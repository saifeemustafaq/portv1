'use client';

import { useState, useEffect } from 'react';
import { CATEGORY_CONFIG } from '@/app/config/categories';
import { CategoryConfig, CategoryType } from '@/types/projects';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { COLOR_PALETTES } from '@/app/config/colorPalettes';

interface ExtendedCategoryConfig extends CategoryConfig {
  _id: string;
  enabled: boolean;
  colorPalette?: string;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] p-8 rounded-lg max-w-md w-full mx-4 border border-[#2a2f3e] shadow-2xl">
        <h3 className="text-xl font-semibold text-[#f8fafc] serif mb-3">{title}</h3>
        <p className="text-[#94a3b8] mb-8 leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="bg-[#0f1117] hover:bg-[#2a2f3e] text-[#94a3b8] border border-[#2a2f3e] min-w-[100px] transition-colors duration-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-[#f8fafc] min-w-[100px] transition-colors duration-300"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CategorySettings() {
  const [categories, setCategories] = useState<Record<CategoryType, ExtendedCategoryConfig>>(() => {
    const defaultCategories: Record<CategoryType, ExtendedCategoryConfig> = {
      product: {
        ...CATEGORY_CONFIG.product,
        _id: '',
        enabled: true,
        colorPalette: 'ocean-depths',
      },
      software: {
        ...CATEGORY_CONFIG.software,
        _id: '',
        enabled: true,
        colorPalette: 'ocean-depths',
      },
      content: {
        ...CATEGORY_CONFIG.content,
        _id: '',
        enabled: true,
        colorPalette: 'ocean-depths',
      },
      innovation: {
        ...CATEGORY_CONFIG.innovation,
        _id: '',
        enabled: true,
        colorPalette: 'ocean-depths',
      },
    };
    
    return defaultCategories;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | ''>('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/settings/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      toast.error('Failed to load category settings');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = async (category: CategoryType, colorPalette: string) => {
    try {
      console.log('Updating color palette:', { category, colorPalette });
      
      // Update local state
      setCategories(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          colorPalette,
        },
      }));

      // Save to database
      const response = await fetch(`/api/admin/settings/categories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryType: category,
          updates: {
            colorPalette,
          },
        }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category color palette');
      }

      toast.success('Color palette updated successfully');
      
      // Refresh categories to ensure we have the latest data
      await loadCategories();
    } catch (error) {
      console.error('Error updating color palette:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update color palette');
      
      // Revert local state on error
      await loadCategories();
    }
  };

  const handleToggleCategory = (category: CategoryType) => {
    const isDisabling = categories[category].enabled;
    if (isDisabling) {
      setConfirmDialog({
        isOpen: true,
        title: 'Disable Category',
        message: `Are you sure you want to disable the "${categories[category].title}" category? This will hide it from project creation.`,
        onConfirm: () => {
          setCategories(prev => ({
            ...prev,
            [category]: {
              ...prev[category],
              enabled: false,
            },
          }));
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setCategories(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          enabled: true,
        },
      }));
    }
  };

  const handleSaveChanges = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Save Changes',
      message: 'Are you sure you want to save these category settings? This will affect project creation and display across the application.',
      onConfirm: saveChanges,
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories }),
      });

      if (!response.ok) {
        throw new Error('Failed to save categories');
      }

      toast.success('Category settings saved successfully');
    } catch (error) {
      toast.error('Failed to save category settings');
      console.error('Error saving categories:', error);
    } finally {
      setSaving(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleInitializeCategories = async () => {
    try {
      const response = await fetch('/api/admin/settings/categories/init', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to initialize categories');
      }
      toast.success('Categories initialized successfully');
      // Reload categories after initialization
      await loadCategories();
    } catch (error) {
      toast.error('Failed to initialize categories');
      console.error('Error initializing categories:', error);
    }
  };

  const handleDeleteProjects = async (category: CategoryType) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Projects',
      message: `Are you sure you want to delete ALL projects in the "${categories[category].title}" category? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/admin/settings/categories', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ categoryType: category }),
          });

          if (!response.ok) {
            throw new Error('Failed to delete projects');
          }

          const data = await response.json();
          toast.success(`Successfully deleted ${data.deletedCount} projects`);
        } catch (error) {
          toast.error('Failed to delete projects');
          console.error('Error deleting projects:', error);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  if (loading) {
    return (
      <Card className="p-8 bg-[#0f1117] border border-[#2a2f3e] rounded-lg">
        <div className="flex items-center justify-center h-40">
          <div className="text-[#94a3b8]">Loading categories...</div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-8 bg-[#0f1117] border border-[#2a2f3e] rounded-lg">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#f8fafc] serif mb-2">Category Management</h2>
            <p className="text-[#94a3b8]">Manage project categories and their appearance across the application</p>
          </div>
          <Button 
            onClick={handleInitializeCategories}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#f8fafc] transition-colors duration-300"
          >
            Initialize Categories
          </Button>
        </div>
        
        <div className="space-y-8">
          <div className="grid gap-6">
            {Object.entries(categories).map(([key, category]) => {
              const currentPalette = COLOR_PALETTES.find(p => p.id === category.colorPalette) || COLOR_PALETTES[0];
              
              return (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-6 rounded-lg bg-[#1a1f2e] border transition-all duration-300"
                  style={{ 
                    borderColor: `${currentPalette.colors.primary}40`,
                    boxShadow: `inset 3px 0 0 ${currentPalette.colors.primary}`,
                  }}
                >
                  <div className="flex items-center space-x-6">
                    <div
                      className="w-10 h-10 rounded-lg shadow-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: currentPalette.colors.primary,
                        boxShadow: `0 4px 12px ${currentPalette.colors.muted}`
                      }}
                    >
                      {key === 'product' && <ProductIcon className="w-5 h-5 text-[#f8fafc]" />}
                      {key === 'software' && <CodeIcon className="w-5 h-5 text-[#f8fafc]" />}
                      {key === 'content' && <DocumentIcon className="w-5 h-5 text-[#f8fafc]" />}
                      {key === 'innovation' && <LightbulbIcon className="w-5 h-5 text-[#f8fafc]" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[#f8fafc] mb-1">{category.title}</h3>
                      <p className="text-[#94a3b8] text-sm">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end space-y-2">
                      <label className="text-xs text-[#94a3b8] font-medium">Color Palette</label>
                      <div className="flex items-center space-x-4">
                        <select
                          value={category.colorPalette || 'ocean-depths'}
                          onChange={(e) => handleColorChange(key as CategoryType, e.target.value)}
                          className="bg-[#1a1f2e] text-[#f8fafc] border border-[#2a2f3e] rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all duration-300"
                        >
                          {COLOR_PALETTES.map((palette) => (
                            <option key={palette.id} value={palette.id}>
                              {palette.name}
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex space-x-1">
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/10"
                            style={{ backgroundColor: currentPalette.colors.primary }}
                            title="Primary"
                          />
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/10"
                            style={{ backgroundColor: currentPalette.colors.secondary }}
                            title="Secondary"
                          />
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/10"
                            style={{ backgroundColor: currentPalette.colors.accent }}
                            title="Accent"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={category.enabled ? "default" : "outline"}
                      onClick={() => handleToggleCategory(key as CategoryType)}
                      className={`min-w-[100px] transition-all duration-300`}
                      style={{
                        backgroundColor: category.enabled ? currentPalette.colors.primary : 'transparent',
                        borderColor: currentPalette.colors.primary,
                        color: category.enabled ? '#f8fafc' : currentPalette.colors.primary,
                      }}
                    >
                      {category.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="p-6 bg-[#1a1f2e] border border-[#2a2f3e]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#f8fafc] serif">Delete Projects</h3>
              </div>
              
              <div className="text-[#94a3b8] mb-4">
                Delete all projects in a specific category. This action cannot be undone.
              </div>

              <div className="flex gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
                  className="flex-1 bg-[#0f1117] text-[#f8fafc] px-3 py-2 rounded-md border border-[#2a2f3e] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                >
                  <option value="">Select a category</option>
                  {Object.entries(categories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.title}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={() => selectedCategory && handleDeleteProjects(selectedCategory as CategoryType)}
                  disabled={!selectedCategory}
                  className="bg-red-600 hover:bg-red-500 text-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  Delete All Projects
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-6 border-t border-[#2a2f3e]">
            <Button 
              onClick={handleSaveChanges} 
              disabled={saving}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#f8fafc] min-w-[120px] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

// Icons components
function ProductIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function CodeIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function DocumentIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LightbulbIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function LoadingSpinner({ className = "w-6 h-6" }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
} 
