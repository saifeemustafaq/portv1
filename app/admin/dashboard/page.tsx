'use client';

import { ErrorBoundary } from '@/app/components/ErrorBoundary';

function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground serif">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-400">
          Welcome to your admin dashboard. Use the navigation menu to manage your content.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Example dashboard cards */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-lg font-medium text-foreground">Products</h3>
          <p className="mt-2 text-sm text-gray-400">
            Manage your products and their details
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-lg font-medium text-foreground">Content</h3>
          <p className="mt-2 text-sm text-gray-400">
            Update your website content and blog posts
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-lg font-medium text-foreground">Software</h3>
          <p className="mt-2 text-sm text-gray-400">
            Manage your software projects and releases
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
} 