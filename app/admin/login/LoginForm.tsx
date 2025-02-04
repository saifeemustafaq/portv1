'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [{ message: errorMessage }, setError] = useState<{ message: string | null }>({ message: null });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // Monitor session status changes
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError({ message: null });
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Just set the error message for the user without console.error
        setError({ message: result.error });
      } else if (!result?.ok) {
        setError({ message: 'An unexpected error occurred' });
        // Keep this console.error as it's an actual unexpected error
        console.error('Unexpected result:', result);
      } else {
        // Wait briefly for session to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force session update
        await update();
        
        // Check session
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        
        if (sessionData?.user) {
          router.push('/admin/dashboard');
        } else {
          console.error('Session not established after successful login');
          setError({ message: 'Failed to establish session. Please try again.' });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError({ message: err instanceof Error ? err.message : 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {errorMessage && (
        <div className="bg-red-500/10 text-red-400 text-sm text-center py-2 px-4 rounded-lg border border-red-500/20">
          {errorMessage}
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
            className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
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
            className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-900 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
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