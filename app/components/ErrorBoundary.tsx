'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logClientError } from '@/app/utils/clientLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logClientError('system', 'React Error Boundary caught an error', error)
      .catch(loggingError => {
        console.error('Failed to log error:', loggingError);
      });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 text-red-500">
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p>Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
} 
