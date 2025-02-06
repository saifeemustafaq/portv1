import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategorySettings } from '../../app/admin/settings/CategorySettings';
import { useCategories } from '../../app/hooks/useCategories';
import { ProjectCategory } from '../../types/projects';

// Mock the useCategories hook
jest.mock('@/app/hooks/useCategories');
const mockUseCategories = useCategories as jest.Mock;

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Category Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockCategories = {
    product: {
      title: 'Product Projects',
      description: 'Product related projects',
      category: 'product' as ProjectCategory,
      color: '#ff0000',
      enabled: true
    },
    software: {
      title: 'Software Projects',
      description: 'Software development projects',
      category: 'software' as ProjectCategory,
      color: '#00ff00',
      enabled: true
    }
  };

  it('should load and display categories', async () => {
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null
    });

    render(<CategorySettings />);

    await waitFor(() => {
      expect(screen.getByText('Product Projects')).toBeInTheDocument();
      expect(screen.getByText('Software Projects')).toBeInTheDocument();
    });

    // Check if colors are applied
    const productCategory = screen.getByText('Product Projects').closest('div');
    expect(productCategory).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('should handle category toggle', async () => {
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null
    });

    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<CategorySettings />);

    // Find and click the toggle button for product category
    const toggleButton = screen.getByText('Enabled').closest('button');
    fireEvent.click(toggleButton!);

    // Should show confirmation dialog
    expect(screen.getByText(/Are you sure you want to disable/)).toBeInTheDocument();

    // Confirm the action
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"enabled":false')
      });
    });
  });

  it('should handle color changes', async () => {
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null
    });

    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<CategorySettings />);

    // Find color input for product category
    const colorInput = screen.getAllByRole('button')[0];
    fireEvent.change(colorInput, { target: { value: '#0000ff' } });

    // Click save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should show confirmation dialog
    expect(screen.getByText(/Are you sure you want to save these category settings/)).toBeInTheDocument();

    // Confirm the action
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"color":"#0000ff"')
      });
    });
  });

  it('should handle loading state', () => {
    mockUseCategories.mockReturnValue({
      categories: {},
      loading: true,
      error: null
    });

    render(<CategorySettings />);
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    mockUseCategories.mockReturnValue({
      categories: {},
      loading: false,
      error: 'Failed to load categories'
    });

    render(<CategorySettings />);
    expect(screen.getByText('Failed to load categories. Please try again.')).toBeInTheDocument();
  });

  it('should handle save errors', async () => {
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null
    });

    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save settings' })
      })
    );

    render(<CategorySettings />);

    // Click save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Confirm the action
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save category settings')).toBeInTheDocument();
    });
  });
}); 
