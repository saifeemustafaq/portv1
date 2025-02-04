'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { RiDashboardLine, RiShoppingBag2Line, RiFileTextLine, RiCodeLine, RiSettings4Line, RiLogoutBoxLine, RiLockPasswordLine, RiAddCircleLine } from 'react-icons/ri';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: RiDashboardLine },
  { name: 'Add Project', href: '/admin/project/add', icon: RiAddCircleLine },
  { name: 'Product', href: '/admin/product', icon: RiShoppingBag2Line },
  { name: 'Content', href: '/admin/content', icon: RiFileTextLine },
  { name: 'Software', href: '/admin/software', icon: RiCodeLine },
  { name: 'Settings', href: '/admin/settings', icon: RiSettings4Line },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return children;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#1a1f2e] border-r border-gray-800">
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
            <span className="text-xl font-semibold text-white serif">Admin Panel</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-600/20 text-white'
                      : 'text-[#e2e8f0] hover:bg-[#2a2f3e] hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-[#94a3b8] group-hover:text-white'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout section */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <Link
              href="/admin/settings/change-password"
              className="flex w-full items-center px-4 py-2 text-sm font-medium text-[#e2e8f0] rounded-full hover:bg-[#2a2f3e] hover:text-white transition-all duration-300"
            >
              <RiLockPasswordLine className="mr-3 h-5 w-5 text-[#94a3b8] group-hover:text-white" />
              Change Password
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-2 text-sm font-medium text-[#e2e8f0] rounded-full hover:bg-[#2a2f3e] hover:text-white transition-all duration-300"
            >
              <RiLogoutBoxLine className="mr-3 h-5 w-5 text-[#94a3b8] group-hover:text-white" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6 px-8 text-[#e2e8f0]">
          {children}
        </main>
      </div>
    </div>
  );
} 