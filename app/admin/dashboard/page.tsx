'use client';

import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import Link from 'next/link';

function DashboardContent() {
  return (
    <div className="space-y-8 p-6">
      <div className="glass-panel rounded-lg p-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-300">
          Welcome to your admin dashboard. Use the navigation menu to manage your content.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/product" className="product-card p-6">
          <h3 className="text-lg font-medium text-product">Products</h3>
          <p className="mt-2 text-sm text-zinc-300">
            Manage your products and their details
          </p>
        </Link>

        <Link href="/admin/content" className="content-card p-6">
          <h3 className="text-lg font-medium text-content">Content</h3>
          <p className="mt-2 text-sm text-zinc-300">
            Update your website content and blog posts
          </p>
        </Link>

        <Link href="/admin/software" className="software-card p-6">
          <h3 className="text-lg font-medium text-software">Software</h3>
          <p className="mt-2 text-sm text-zinc-300">
            Manage your software projects and releases
          </p>
        </Link>

        <Link href="/admin/innovation" className="innovation-card p-6">
          <h3 className="text-lg font-medium text-innovation">Innovation</h3>
          <p className="mt-2 text-sm text-zinc-300">
            Explore and manage innovation projects
          </p>
        </Link>
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