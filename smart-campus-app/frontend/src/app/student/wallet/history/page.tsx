'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import studentNav from '../nav';
import { Badge, LoadingSkeleton, EmptyState } from '@/components/UI';
import { formatBDT, formatDate, formatDateTime } from '@/lib/utils';

export default function WalletHistoryPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wallet/transactions', { params: { page, limit: 20 } }).then(r => {
      setTransactions(r.data.data); setTotal(r.data.meta?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const exportCSV = () => {
    const csv = transactions.map(t => `${t.referenceId},${t.type},${t.direction},${t.amount},${t.status},${t.createdAt}`).join('\n');
    const blob = new Blob([`Reference,Type,Direction,Amount,Status,Date\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
    show('CSV downloaded', 'success');
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/wallet/history" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📥 Download CSV</button>
      </div>

      {loading ? <LoadingSkeleton lines={6} /> : transactions.length === 0 ? (
        <EmptyState icon="📊" title="No Transactions" description="Your transaction history will appear here." />
      ) : (
        <div className="card">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded px-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.direction === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {tx.direction === 'CREDIT' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge text={tx.type.replace('_', ' ')} variant="info" />
                    <Badge text={tx.status} variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'} />
                    <span className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</span>
                  </div>
                </div>
              </div>
              <span className={`text-sm font-semibold ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.direction === 'CREDIT' ? '+' : '-'}{formatBDT(tx.amount)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="text-sm text-gray-600">Page {page} of {Math.ceil(total / 20)}</span>
            <button className="btn btn-sm btn-secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
