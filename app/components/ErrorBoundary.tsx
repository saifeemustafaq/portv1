'use client';

import React from 'react';
import { Button } from './ui/button';
import { ProjectError } from '../utils/errors/ProjectErrors';
import { logClientError } from '../utils/clientLogger';
import type { LogCategory } from '../utils/logger';

interface Props {
  children: React.ReactNode;
  name?: string; // Component/section name for better error tracking
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  componentStack: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      componentStack: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null,
      componentStack: null
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Set the error info in state for rendering
    this.setState({
      errorInfo,
      componentStack: errorInfo.componentStack || null
    });

    // Log error with enhanced context
    await logClientError('system' as LogCategory, `Error in ${this.props.name || 'unknown component'}`, error);

    // Log additional component stack trace
    console.error('Component Stack:', errorInfo.componentStack);
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof ProjectError) {
      return error.message;
    }
    // Add more specific error type checks here
    if (error instanceof TypeError) {
      return 'There was a problem with the data format. Please try again.';
    }
    if (error instanceof ReferenceError) {
      return 'There was a technical issue. Please refresh the page.';
    }
    return 'An unexpected error occurred. Please try again later.';
  }

  private getErrorAction(error: Error): { label: string; action: () => void } {
    if (error instanceof ProjectError) {
      return {
        label: 'Try Again',
        action: () => window.location.reload(),
      };
    }
    // Add more specific error type actions
    if (error instanceof TypeError) {
      return {
        label: 'Refresh Data',
        action: () => window.location.reload(),
      };
    }
    return {
      label: 'Go to Dashboard',
      action: () => window.location.href = '/admin/dashboard',
    };
  }

  render() {
    if (this.state.hasError) {
      const message = this.getErrorMessage(this.state.error!);
      const { label, action } = this.getErrorAction(this.state.error!);

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Something went wrong
          </h3>
          <p className="mb-4 text-sm text-gray-600">{message}</p>
          <div className="space-y-2">
            <Button onClick={action} variant="default">{label}</Button>
            {process.env.NODE_ENV === 'development' && this.state.componentStack && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Technical Details</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-100 p-4 text-xs">
                  {this.state.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 
