'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import libraryNav from '../nav';
import Link from 'next/link';

export default function LibraryDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/library/dashboard').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout navItems={libraryNav} activePath="/library/dashboard" userName="" role="Library" onLogout={logout}><LoadingSkeleton lines={6} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/dashboard" userName={user?.fullName || 'Staff'} role="Library Staff" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Library Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Issued Today" value={String(data?.issuedToday || 0)} icon="📤" color="blue" />
        <KPICard title="Returned Today" value={String(data?.returnedToday || 0)} icon="📥" color="green" />
        <KPICard title="Overdue" value={String(data?.overdueCount || 0)} icon="⚠️" color="red" />
        <KPICard title="Fines Today" value={formatBDT(data?.fineCollectedToday || 0)} icon="💰" color="purple" />
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/library/issue" className="btn btn-primary btn-lg flex-1">📤 Issue Book</Link>
        <Link href="/library/return" className="btn btn-success btn-lg flex-1">📥 Return Book</Link>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">Top Overdue Books</h2>
          <Link href="/library/overdue" className="text-sm text-blue-600 font-medium">View All</Link>
        </div>
        {data?.topOverdue?.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No overdue books 🎉</p>
        ) : (
          <div className="space-y-2">
            {data?.topOverdue?.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{o.book?.title}</p>
                  <p className="text-xs text-gray-500">{o.student?.fullName} • Due: {formatDate(o.dueDate)}</p>
                </div>
                <Link href="/library/overdue" className="btn btn-danger btn-sm">Remind</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
