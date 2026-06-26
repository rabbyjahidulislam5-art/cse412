'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton, DataTable, Pagination, Badge, EmptyState } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import studentNav from '../nav';

export default function StudentLedgerPage() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (type) params.type = type;
      if (from) params.from = from;
      if (to) params.to = to;
      const r = await api.get('/wallet/ledger', { params });
      setEntries(r.data.data);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      // Derive summary from wallet balance + transactions stats
      const [bal, tx] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions', { params: { limit: 1 } }),
      ]);
      setSummary({
        balance: bal.data.data.balance || 0,
        count: tx.data.meta?.total || 0,
        totalTopup: 0,
        totalSent: 0,
      });
    } catch {}
  };

  useEffect(() => { fetchLedger(); fetchSummary(); }, [page, type, from, to]);

  const exportCSV = () => {
    const csv = entries.map(e => [
      formatDateTime(e.createdAt),
      e.type,
      e.direction,
      e.amount,
      e.balanceAfter,
      e.description || '',
    ].join(',')).join('\n');
    const blob = new Blob([`Date,Type,Direction,Amount (paisa),Balance After,Description\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ledger.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'createdAt', label: 'Date', render: (v: any) => <span className="text-sm">{formatDateTime(v)}</span> },
    {
      key: 'type', label: 'Type', render: (v: any) => (
        <Badge text={v} variant={v === 'TOPUP' ? 'success' : v === 'TRANSFER' ? 'info' : v === 'QR_PAYMENT' ? 'warning' : v === 'FINE_PAYMENT' ? 'danger' : 'default'} />
      )
    },
    { key: 'description', label: 'Description', render: (v: any) => v || '—' },
    {
      key: 'direction', label: 'Direction', render: (v: any) => (
        <span className={`text-xs font-medium ${v === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>{v === 'CREDIT' ? '↑ IN' : '↓ OUT'}</span>
      )
    },
    {
      key: 'amount', label: 'Amount', render: (v: any, row: any) => (
        <span className={`font-semibold ${row.direction === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
          {row.direction === 'CREDIT' ? '+' : '-'}{formatBDT(v || 0)}
        </span>
      )
    },
    { key: 'balanceAfter', label: 'Balance After', render: (v: any) => <span className="font-mono text-sm text-gray-700">{formatBDT(v || 0)}</span> },
  ];

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/ledger" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Ledger</h1>
          <p className="text-sm text-gray-500">Complete chronological transaction record</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="Total Top-ups" value={formatBDT(summary.totalTopup || 0)} icon="📥" color="green" />
          <KPICard title="Total Sent" value={formatBDT(summary.totalSent || 0)} icon="📤" color="red" />
          <KPICard title="Transactions" value={String(summary.count || 0)} icon="📊" color="blue" />
          <KPICard title="Current Balance" value={formatBDT(summary.balance || 0)} icon="💳" color="purple" />
        </div>
      )}

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select className="input py-1.5 text-sm" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="TOPUP">Top-up</option>
              <option value="TRANSFER">Transfer</option>
              <option value="QR_PAYMENT">QR Payment</option>
              <option value="FINE_PAYMENT">Fine Payment</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" className="input py-1.5 text-sm" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" className="input py-1.5 text-sm" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setType(''); setFrom(''); setTo(''); setPage(1); }}>Reset</button>
        </div>
      </div>

      {loading ? <LoadingSkeleton lines={10} /> : entries.length === 0 ? (
        <EmptyState icon="📒" title="No ledger entries" description="Your transactions will appear here once you start using your wallet." />
      ) : (
        <>
          <DataTable columns={columns} data={entries} emptyMessage="No entries" />
          <Pagination page={page} totalPages={Math.ceil(total / 50)} onPageChange={setPage} />
        </>
      )}
    </DashboardLayout>
  );
}
