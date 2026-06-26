'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Badge } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import libraryNav from '../nav';

export default function LibraryFinesPage() {
  const { user, logout } = useAuth();
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/library/fines').then(r => setFines(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'type', label: 'Type', render: () => <Badge text="LIBRARY" variant="danger" /> },
    { key: 'description', label: 'Description' },
    { key: 'accumulatedAmount', label: 'Amount', render: (v: any) => formatBDT(v) },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'PAID' ? 'success' : v === 'WAIVED' ? 'info' : 'danger'} /> },
    { key: 'createdAt', label: 'Created', render: (v: any) => formatDate(v) },
  ];

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/fines" userName={user?.fullName || ''} role="Library Staff" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Library Fine Records</h1>
      {loading ? <LoadingSkeleton lines={8} /> : <DataTable columns={columns} data={fines} emptyMessage="No library fines" />}
    </DashboardLayout>
  );
}
