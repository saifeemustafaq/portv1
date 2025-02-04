'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logClientError, logClientAuth } from '@/app/utils/clientLogger';

interface ValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // Monitor session status changes
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  const validateForm = (username: string, password: string): boolean => {
    const newErrors: ValidationErrors = {};

    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!validateForm(username, password)) {
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        logClientAuth('Login failed', { error: result.error })
          .catch(error => console.error('Failed to log auth error:', error));
          
        setErrors({ general: 'Invalid username or password' });
      } else {
        logClientAuth('Login successful')
          .catch(error => console.error('Failed to log auth success:', error));
          
        router.push('/admin/dashboard');
      }
    } catch (error) {
      if (error instanceof Error) {
        logClientError('auth', 'Login error', error)
          .catch(loggingError => console.error('Failed to log error:', loggingError));
      }
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {errors.general && (
        <div className="bg-red-500/10 text-red-400 text-sm text-center py-2 px-4 rounded-lg border border-red-500/20">
          {errors.general}
        </div>
      )}
      <div className="space-y-4 rounded-md">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className={`appearance-none relative block w-full px-3 py-2 border ${
              errors.username ? 'border-red-500' : 'border-gray-700'
            } bg-gray-900 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            disabled={loading}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-400">{errors.username}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className={`appearance-none relative block w-full px-3 py-2 border ${
              errors.password ? 'border-red-500' : 'border-gray-700'
            } bg-gray-900 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            disabled={loading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`relative w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
          loading
            ? 'bg-blue-600/50 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
} 