'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Pagination } from '@/components/UI';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import adminNav from '../nav';

export default function AuditPage() {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/audit', { params: { page, limit: 25 } });
      setLogs(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const columns = [
    { key: 'action', label: 'Action', render: (v: any) => <span className="font-mono text-xs">{v}</span> },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityId', label: 'Entity ID', render: (v: any) => v ? <span className="font-mono text-xs">{v.slice(0, 8)}...</span> : 'N/A' },
    { key: 'ipAddress', label: 'IP', render: (v: any) => v || 'N/A' },
    { key: 'timestamp', label: 'Time', render: (v: any) => formatDateTime(v) },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/audit" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>
      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={logs} emptyMessage="No audit logs" />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}
    </DashboardLayout>
  );
}
