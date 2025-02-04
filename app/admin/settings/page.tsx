'use client';

import { RiSettings4Line } from 'react-icons/ri';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white serif">
          Settings
        </h1>
        <p className="mt-2 text-[#94a3b8]">
          Manage your application settings
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#1a1f2e] rounded-lg border border-gray-800">
        <RiSettings4Line className="w-16 h-16 text-[#94a3b8] mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Under Development
        </h2>
        <p className="text-[#94a3b8] text-center max-w-md">
          The settings page is currently under development. Please check back later for updates.
        </p>
      </div>
    </div>
  );
} 