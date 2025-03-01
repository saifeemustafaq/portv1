'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import Link from 'next/link';
import { logClientError, logClientInfo } from '@/app/utils/clientLogger';
import { RiRefreshLine } from 'react-icons/ri';

interface DashboardStats {
  products: number;
  software: number;
  content: number;
  innovation: number;
}

function DashboardWidget({ 
  title, 
  count, 
  href, 
  colorClass, 
  isLoading, 
  error 
}: { 
  title: string; 
  count: number; 
  href: string; 
  colorClass: string;
  isLoading: boolean;
  error: boolean;
}) {
  return (
    <Link href={href} className={`${colorClass} p-6 relative`}>
      {isLoading ? (
        <div className="flex items-center justify-center h-16">
          <div className="animate-pulse w-full">
            <div className="h-4 bg-gray-300/20 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-300/20 rounded w-1/4"></div>
          </div>
        </div>
      ) : error ? (
        <div>
          <h3 className={`text-lg font-medium text-${title.toLowerCase()}`}>{title}</h3>
          <p className="mt-2 text-sm text-red-400">
            Failed to load data
          </p>
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">Error</span>
          </div>
        </div>
      ) : (
        <>
          <h3 className={`text-lg font-medium text-${title.toLowerCase()}`}>{title}</h3>
          <p className="mt-2 text-sm text-zinc-300">
            {count} {count === 1 ? 'project' : 'projects'} available
          </p>
        </>
      )}
    </Link>
  );
}

interface DashboardContentProps {
  initialSession: {
    user: {
      id: string;
      name: string;
      email: string;
      loginTime: number;
      sessionId: string;
    };
    expires: string;
    loginTime: number;
    sessionId: string;
  };
}

export default function DashboardContent({ initialSession }: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    software: 0,
    content: 0,
    innovation: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(false);
      
      const response = await fetch('/api/admin/dashboard/stats');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setStats(data.stats || {
        products: 0,
        software: 0,
        content: 0,
        innovation: 0
      });
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Only log success if not in an error recovery state
      if (retryCount === 0) {
        await logClientInfo('system', 'Dashboard stats loaded successfully', {
          statsLoaded: true,
          timestamp: new Date().toISOString()
        }).catch(console.error); // Prevent logging errors from affecting the UI
      }
    } catch (err) {
      const error = err as Error;
      setError(true);
      
      // Only log errors if not in a retry state to prevent cascading errors
      if (retryCount === 0) {
        await logClientError('system', 'Failed to fetch dashboard stats', error)
          .catch(console.error); // Prevent logging errors from affecting the UI
      }
      
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]); // Only depend on retryCount

  const handleRetry = useCallback(async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      await fetchDashboardStats();
    }
  }, [retryCount, fetchDashboardStats]);

  useEffect(() => {
    fetchDashboardStats().catch(error => {
      console.error('Error in dashboard useEffect:', error);
    });
  }, [fetchDashboardStats]); // Now safe to depend on fetchDashboardStats since it's memoized

  return (
    <ErrorBoundary name="DashboardContent">
      <div className="space-y-8 p-6">
        <div className="glass-panel rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-zinc-300">
                Welcome to your admin dashboard. Use the navigation menu to manage your content.
              </p>
            </div>
            {(error || retryCount > 0) && (
              <button
                onClick={handleRetry}
                disabled={isLoading || retryCount >= 3}
                className="flex items-center px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
              >
                <RiRefreshLine className="mr-1 h-4 w-4" />
                Retry {retryCount > 0 ? `(${retryCount}/3)` : ''}
              </button>
            )}
          </div>
          
          {error && retryCount >= 3 && (
            <div className="mt-4 bg-red-500/10 text-red-400 text-sm py-2 px-4 rounded-lg border border-red-500/20">
              Unable to load dashboard data after multiple attempts. Please try again later.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardWidget 
            title="Products" 
            count={stats.products} 
            href="/admin/product" 
            colorClass="product-card" 
            isLoading={isLoading}
            error={error}
          />

          <DashboardWidget 
            title="Content" 
            count={stats.content} 
            href="/admin/content" 
            colorClass="content-card" 
            isLoading={isLoading}
            error={error}
          />

          <DashboardWidget 
            title="Software" 
            count={stats.software} 
            href="/admin/software" 
            colorClass="software-card" 
            isLoading={isLoading}
            error={error}
          />

          <DashboardWidget 
            title="Innovation" 
            count={stats.innovation} 
            href="/admin/innovation" 
            colorClass="innovation-card" 
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
} 