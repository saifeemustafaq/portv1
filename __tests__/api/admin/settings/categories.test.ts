import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/settings/categories/route';
import { getServerSession } from 'next-auth';
import Category from '@/models/Category';
import connectDB from '@/lib/db';
import { ProjectCategory } from '@/types/projects';
import { Query } from 'mongoose';

// Mock Next-Auth
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.Mock;

// Mock MongoDB connection
jest.mock('@/lib/db');
const mockConnectDB = connectDB as jest.Mock;

// Mock Category model
jest.mock('@/models/Category');
const mockCategory = Category as jest.Mocked<typeof Category>;

describe('Category Settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } });
    mockConnectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/admin/settings/categories', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);
      const response = await GET();
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return categories if authenticated', async () => {
      const mockCategories = [
        {
          category: 'product' as const,
          title: 'Product Projects',
          description: 'Product related projects',
          color: '#ff0000',
          enabled: true
        },
        {
          category: 'software' as const,
          title: 'Software Projects',
          description: 'Software development projects',
          color: '#00ff00',
          enabled: true
        }
      ];

      mockCategory.find.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCategories)
        })
      } as unknown as Query<unknown[], unknown>);

      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('categories');
      expect(data.categories).toHaveProperty('product');
      expect(data.categories).toHaveProperty('software');
    });

    it('should handle database errors', async () => {
      mockCategory.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET();
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'Failed to fetch category settings'
      });
    });
  });

  describe('POST /api/admin/settings/categories', () => {
    const mockRequest = (body: Record<string, unknown>) =>
      new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify(body)
      });

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);
      const response = await POST(mockRequest({ categories: {} }));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should update categories successfully', async () => {
      const mockCategories = {
        product: {
          title: 'Product Projects',
          description: 'Product related projects',
          category: 'product' as ProjectCategory,
          color: '#ff0000',
          enabled: true
        }
      };

      mockCategory.findOneAndUpdate.mockResolvedValue(mockCategories.product);

      const response = await POST(mockRequest({ categories: mockCategories }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });

      expect(mockCategory.findOneAndUpdate).toHaveBeenCalledWith(
        { category: 'product' },
        {
          $set: {
            title: 'Product Projects',
            description: 'Product related projects',
            color: '#ff0000',
            enabled: true
          }
        },
        { upsert: true }
      );
    });

    it('should handle validation errors', async () => {
      const invalidCategories = {
        invalid: {
          title: '',
          description: '',
          category: 'invalid' as ProjectCategory,
          color: 'invalid-color',
          enabled: 'not-boolean'
        }
      };

      const response = await POST(mockRequest({ categories: invalidCategories }));
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'Failed to save category settings'
      });
    });

    it('should handle database errors during update', async () => {
      mockCategory.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

      const response = await POST(mockRequest({
        categories: {
          product: {
            title: 'Product Projects',
            description: 'Product related projects',
            category: 'product' as ProjectCategory,
            color: '#ff0000',
            enabled: true
          }
        }
      }));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'Failed to save category settings'
      });
    });
  });
}); 