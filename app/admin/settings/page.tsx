'use client';

import { CategorySettings } from './CategorySettings';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8 bg-[#0f1117]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc] serif">
          Settings
        </h1>
        <p className="mt-2 text-[#94a3b8]">
          Manage your application settings
        </p>
      </div>

      <div className="grid gap-6">
        <CategorySettings />
      </div>
    </div>
  );
} 