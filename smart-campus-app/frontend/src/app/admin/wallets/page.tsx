'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Badge, Pagination, KPICard } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import adminNav from '../nav';

export default function WalletsPage() {
  const { user, logout } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/wallets', { params: { page, limit: 25 } });
      setWallets(r.data.data); setTotal(r.data.meta?.total || 0);
      setTotalBalance(r.data.data.reduce((s: number, w: any) => s + Number(w.balance), 0));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchWallets(); }, [page]);

  const columns = [
    { key: 'user', label: 'Owner', render: (v: any) => v?.fullName || 'N/A' },
    { key: 'balance', label: 'Balance', render: (v: any) => <span className="font-semibold">{formatBDT(v)}</span> },
    { key: 'pendingBalance', label: 'Pending', render: (v: any) => formatBDT(v) },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'ACTIVE' ? 'success' : 'danger'} /> },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/wallets" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Total Wallets" value={String(total)} icon="💰" color="blue" />
        <KPICard title="Total Balance" value={formatBDT(totalBalance)} icon="💎" color="green" />
        <KPICard title="Current Page" value={`${page}/${Math.ceil(total / 25)}`} icon="📄" color="purple" />
      </div>
      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={wallets} />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}
    </DashboardLayout>
  );
}
