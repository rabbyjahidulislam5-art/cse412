'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import libraryNav from '../nav';

export default function LibraryReportsPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/library/reports').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout navItems={libraryNav} activePath="/library/reports" userName="" role="Library" onLogout={logout}><LoadingSkeleton lines={6} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/reports" userName={user?.fullName || ''} role="Library Staff" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Library Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Issues (30d)" value={String(data?.issueCount || 0)} icon="📤" color="blue" />
        <KPICard title="Returns (30d)" value={String(data?.returnCount || 0)} icon="📥" color="green" />
        <KPICard title="Overdue" value={String(data?.overdueCount || 0)} icon="⚠️" color="red" />
        <KPICard title="Fines Collected" value={formatBDT(data?.fineCollected || 0)} icon="💰" color="purple" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Most Issued Books (30 days)</h2>
        {data?.topBooks?.length ? (
          <div className="space-y-2">
            {data.topBooks.map((b: any, i: number) => (
              <div key={b.bookId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3"><span className="text-lg font-bold text-gray-400">#{i + 1}</span><span className="text-sm">Book ID: {b.bookId?.slice(0, 8)}...</span></div>
                <span className="font-semibold text-blue-600">{b._count?.id || 0} issues</span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-center py-4">No data</p>}
      </div>
    </DashboardLayout>
  );
}
