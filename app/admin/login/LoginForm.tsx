'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logClientError, logClientAuth, logClientInfo } from '@/app/utils/clientLogger';

interface ValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

// Maximum login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function LoginForm() {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check for existing lockout in localStorage
  useEffect(() => {
    const storedLockout = localStorage.getItem('login_lockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        // Clear expired lockout
        localStorage.removeItem('login_lockout');
      }
    }

    const storedAttempts = localStorage.getItem('login_attempts');
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  // Monitor session status changes
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout');
      
      logClientInfo('auth', 'User authenticated, redirecting to dashboard')
        .catch(error => console.error('Failed to log auth info:', error));
        
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const interval = setInterval(() => {
      if (lockoutUntil <= Date.now()) {
        setLockoutUntil(null);
        localStorage.removeItem('login_lockout');
        clearInterval(interval);
      } else {
        // Force re-render to update countdown
        setLockoutUntil(prevLockout => prevLockout);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const validateForm = useCallback((username: string, password: string): boolean => {
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
  }, []);

  const handleLoginAttempt = useCallback((success: boolean) => {
    if (success) {
      // Reset on success
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      return;
    }
    
    // Increment attempts on failure
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('login_attempts', newAttempts.toString());
    
    // Check if we should lock out
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION;
      setLockoutUntil(lockoutTime);
      localStorage.setItem('login_lockout', lockoutTime.toString());
      
      logClientAuth('Account temporarily locked due to too many failed attempts', {
        attempts: newAttempts,
        lockoutDuration: LOCKOUT_DURATION / 1000,
      }).catch(error => console.error('Failed to log auth lockout:', error));
    }
  }, [loginAttempts]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if account is locked
    if (lockoutUntil && lockoutUntil > Date.now()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    setRecoveryMode(false);

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
        handleLoginAttempt(false);
        
        logClientAuth('Login failed', { 
          error: result.error,
          attempts: loginAttempts + 1,
        }).catch(error => console.error('Failed to log auth error:', error));
          
        setErrors({ general: 'Invalid username or password' });
      } else {
        handleLoginAttempt(true);
        
        logClientAuth('Login successful')
          .catch(error => console.error('Failed to log auth success:', error));
      }
    } catch (error) {
      setRecoveryMode(true);
      
      if (error instanceof Error) {
        logClientError('auth', 'Login error', error)
          .catch(loggingError => console.error('Failed to log error:', loggingError));
          
        setErrors({ 
          general: 'An unexpected error occurred. Please try again.' 
        });
      } else {
        logClientError('auth', 'Unknown login error', new Error('Unknown error during login'))
          .catch(loggingError => console.error('Failed to log error:', loggingError));
          
        setErrors({ 
          general: 'An unknown error occurred. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Format the remaining lockout time
  const formatLockoutTime = useCallback(() => {
    if (!lockoutUntil) return '';
    
    const remainingMs = Math.max(0, lockoutUntil - Date.now());
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [lockoutUntil]);

  // Recovery mode - allow user to reset their session
  const handleResetSession = () => {
    setLoginAttempts(0);
    setLockoutUntil(null);
    setErrors({});
    setRecoveryMode(false);
    localStorage.removeItem('login_attempts');
    localStorage.removeItem('login_lockout');
    
    logClientInfo('auth', 'User reset login session')
      .catch(error => console.error('Failed to log session reset:', error));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {errors.general && (
        <div className="bg-red-500/10 text-red-400 text-sm text-center py-2 px-4 rounded-lg border border-red-500/20">
          {errors.general}
          {recoveryMode && (
            <button
              type="button"
              onClick={handleResetSession}
              className="ml-2 underline text-blue-400 hover:text-blue-300"
            >
              Reset Session
            </button>
          )}
        </div>
      )}
      
      {lockoutUntil && lockoutUntil > Date.now() && (
        <div className="bg-amber-500/10 text-amber-400 text-sm text-center py-2 px-4 rounded-lg border border-amber-500/20">
          Too many failed login attempts. Please try again in {formatLockoutTime()}.
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
            disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
            aria-invalid={errors.username ? 'true' : 'false'}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <p id="username-error" className="mt-1 text-sm text-red-400">{errors.username}</p>
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
            disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-400">{errors.password}</p>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
        className={`relative w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
          loading || (lockoutUntil !== null && lockoutUntil > Date.now())
            ? 'bg-blue-600/50 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
} 