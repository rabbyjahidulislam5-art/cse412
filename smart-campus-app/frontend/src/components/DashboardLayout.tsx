'use client';
import { ReactNode } from 'react';
import Sidebar, { MobileNav } from './Sidebar';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
  navItems: { label: string; icon: string; href: string; badge?: number }[];
  activePath: string;
  userName: string;
  onLogout: () => void;
}

export default function DashboardLayout({ children, role, navItems, activePath, userName, onLogout }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={navItems} activePath={activePath} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} role={role} userName={userName} onLogout={onLogout} />
      <MobileNav items={navItems} activePath={activePath} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between lg:hidden">
          <span className="font-semibold text-gray-900">Smart Campus</span>
          <span className="text-xs text-gray-500">{role}</span>
        </header>
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
