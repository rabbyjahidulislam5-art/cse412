'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, Pagination, LoadingSkeleton, Badge } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import shopNav from '../nav';

export default function ShopTransactionsPage() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTx = async () => {
    setLoading(true);
    try {
      const r = await api.get('/shop/transactions', { params: { page, limit: 25 } });
      setTransactions(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTx(); }, [page]);

  const exportCSV = () => {
    const csv = transactions.map(t => `${formatDateTime(t.createdAt)},${t.transaction?.wallet?.user?.studentId || ''},${t.settlementAmount || 0},${t.status}`).join('\n');
    const blob = new Blob([`Date,Student,Amount,Status\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shop-transactions.csv'; a.click();
  };

  const columns = [
    { key: 'createdAt', label: 'Date', render: (v: any) => formatDateTime(v) },
    { key: 'transaction', label: 'Student', render: (v: any) => v?.wallet?.user?.studentId || 'Student' },
    { key: 'settlementAmount', label: 'Amount', render: (v: any) => <span className="font-semibold text-green-600">+{formatBDT(v || 0)}</span> },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'COMPLETED' ? 'success' : 'warning'} /> },
    { key: 'settledAt', label: 'Settled', render: (v: any) => v ? formatDateTime(v) : 'Pending' },
  ];

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/transactions" userName={user?.fullName || ''} role="Shop Owner" onLogout={logout}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📥 Export CSV</button>
      </div>
      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={transactions} emptyMessage="No transactions yet" />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}
    </DashboardLayout>
  );
}
