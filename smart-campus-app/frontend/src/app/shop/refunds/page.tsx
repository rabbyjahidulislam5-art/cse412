'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, Pagination, LoadingSkeleton, Badge, EmptyState } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import shopNav from '../nav';

export default function ShopRefundsPage() {
  const { user, logout } = useAuth();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const r = await api.get('/shop/refunds', { params: { page, limit: 20 } });
      setRefunds(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRefunds(); }, [page]);

  const columns = [
    { key: 'referenceId', label: 'Reference', render: (v: any) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'wallet', label: 'Student', render: (v: any) => v?.user?.studentId || v?.user?.fullName || '—' },
    { key: 'amount', label: 'Amount', render: (v: any) => <span className="font-semibold text-red-500">-{formatBDT(v || 0)}</span> },
    { key: 'description', label: 'Description', render: (v: any) => <span className="text-sm text-gray-600 truncate max-w-[200px]">{v || '—'}</span> },
    {
      key: 'status', label: 'Status', render: (v: any) => (
        <Badge text={v || 'PENDING'} variant={v === 'COMPLETED' ? 'success' : v === 'FAILED' ? 'danger' : 'warning'} />
      )
    },
    { key: 'createdAt', label: 'Date', render: (v: any) => formatDateTime(v) },
  ];

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/refunds" userName={user?.fullName || ''} role="Shop Owner" onLogout={logout}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
          <p className="text-sm text-gray-500">Track refund transactions processed on your account</p>
        </div>
      </div>

      {loading ? <LoadingSkeleton lines={8} /> : refunds.length === 0 ? (
        <EmptyState icon="🔄" title="No refunds" description="Refund transactions will appear here when they are processed." />
      ) : (
        <>
          <DataTable columns={columns} data={refunds} emptyMessage="No refunds" />
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
        </>
      )}
    </DashboardLayout>
  );
}
