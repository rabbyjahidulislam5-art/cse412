'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Badge, Pagination } from '@/components/UI';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import adminNav from '../nav';

export default function SecurityPage() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/security', { params: { page, limit: 25 } });
      setEvents(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [page]);

  const columns = [
    { key: 'eventType', label: 'Event', render: (v: any) => <span className="font-mono text-xs">{v}</span> },
    { key: 'severity', label: 'Severity', render: (v: any) => <Badge text={v} variant={v === 'CRITICAL' ? 'danger' : v === 'HIGH' ? 'warning' : 'info'} /> },
    { key: 'user', label: 'User', render: (v: any) => v?.studentId || v?.fullName || 'System' },
    { key: 'ipAddress', label: 'IP Address', render: (v: any) => v || 'N/A' },
    { key: 'timestamp', label: 'Time', render: (v: any) => formatDateTime(v) },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/security" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Monitor</h1>
      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={events} emptyMessage="No security events" />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}
    </DashboardLayout>
  );
}
