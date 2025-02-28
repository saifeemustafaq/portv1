'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logError } from '@/app/utils/logger';

// Custom error classes
class PasswordFormError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'PasswordFormError';
  }
}

class ValidationError extends PasswordFormError {
  constructor(message: string, field?: string) {
    super(message, field);
    this.name = 'ValidationError';
  }
}

class NetworkError extends PasswordFormError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Constants
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function validatePassword(password: string, field: string): void {
  if (!password) {
    throw new ValidationError('Password is required', field);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`, field);
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      field
    );
  }
}

export default function ChangePasswordPage() {
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const currentPassword = formData.get('currentPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Validate current password
      validatePassword(currentPassword, 'currentPassword');

      // Validate new password
      validatePassword(newPassword, 'newPassword');

      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        throw new ValidationError('New passwords do not match', 'confirmPassword');
      }

      // Ensure new password is different from current
      if (currentPassword === newPassword) {
        throw new ValidationError('New password must be different from current password', 'newPassword');
      }

      const response = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new NetworkError('Your session has expired. Please log in again.');
        }
        throw new NetworkError(data.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      formRef.current?.reset();

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldError(error.field || 'currentPassword', error.message);
      } else if (error instanceof NetworkError) {
        setError(error.message);
        if (error.message.includes('session has expired')) {
          setTimeout(() => {
            router.push('/admin/login');
          }, 1500);
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while changing password';
        setError(errorMessage);
        logError('auth', 'PASSWORD_CHANGE_ERROR', error instanceof Error ? error : new Error(errorMessage));
      }
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white serif">
          Change Password
        </h1>
        <p className="mt-2 text-[#94a3b8]">
          Update your admin account password
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="currentPassword" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Current Password <span className="text-red-400">*</span>
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.currentPassword ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Enter your current password"
          />
          {fieldErrors.currentPassword && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.currentPassword}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            New Password <span className="text-red-400">*</span>
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.newPassword ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Enter your new password"
          />
          {fieldErrors.newPassword && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.newPassword}</p>
          )}
          <p className="mt-1 text-xs text-[#94a3b8]">
            Password must be at least 8 characters long and contain at least one uppercase letter,
            one lowercase letter, one number, and one special character.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#e2e8f0] mb-1">
            Confirm New Password <span className="text-red-400">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            onChange={() => clearErrors()}
            className={`relative block w-full rounded-lg border-0 bg-[#1a1f2e] py-3 px-4 text-white placeholder:text-[#94a3b8] ring-1 ring-inset ${
              fieldErrors.confirmPassword ? 'ring-red-500' : 'ring-gray-700'
            } focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6`}
            placeholder="Confirm your new password"
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Changing password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
} 