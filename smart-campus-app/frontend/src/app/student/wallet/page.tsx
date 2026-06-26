'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { TabBar, Badge, Pagination, LoadingSkeleton } from '@/components/UI';
import { useCountUp } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import Link from 'next/link';

const studentNav = [
  { label: 'Home', icon: '🏠', href: '/student/dashboard' },
  { label: 'Wallet', icon: '💳', href: '/student/wallet' },
  { label: 'QR Pay', icon: '📷', href: '/student/qr-pay' },
  { label: 'Fines', icon: '📋', href: '/student/fines' },
  { label: 'Advising', icon: '🎓', href: '/student/advising' },
  { label: 'Profile', icon: '👤', href: '/student/profile' },
  { label: 'Support', icon: '💬', href: '/student/support' },
  { label: 'Settings', icon: '⚙️', href: '/student/settings' },
];

export default function WalletPage() {
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [masked, setMasked] = useState(true);

  const balance = useCountUp(wallet ? Number(wallet.balance) / 100 : 0, 400);

  const fetchWallet = async () => {
    try { const r = await api.get('/wallet/balance'); setWallet(r.data.data); } catch {}
  };

  const fetchTx = async () => {
    try {
      const params: any = { page, limit: 20 };
      if (tab !== 'all') params.direction = tab === 'credits' ? 'CREDIT' : 'DEBIT';
      const r = await api.get('/wallet/transactions', { params });
      setTransactions(r.data.data);
      setTotal(r.data.meta?.total || 0);
    } catch {}
  };

  useEffect(() => { fetchWallet(); fetchTx(); }, [tab, page]);

  useEffect(() => { setLoading(false); }, [transactions]);

  const actionBtns = [
    { icon: '➕', label: 'Top Up', href: '/student/wallet/topup' },
    { icon: '💸', label: 'Withdraw', href: '/student/wallet/withdraw' },
    { icon: '↗️', label: 'Transfer', href: '/student/wallet/transfer' },
    { icon: '📷', label: 'QR Pay', href: '/student/qr-pay' },
  ];

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/wallet" userName={user?.fullName || 'Student'} role="Student" onLogout={logout}>
      <div className="wallet-card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-sm">Available Balance</p>
            <p className="text-3xl md:text-4xl font-bold mt-1 cursor-pointer" onClick={() => setMasked(!masked)}>
              {masked ? '৳ ••••••' : `৳ ${balance.toLocaleString()}`}
            </p>
            <p className="text-blue-200 text-xs mt-1">Tap to {masked ? 'reveal' : 'hide'}</p>
          </div>
          <div className="text-2xl">💳</div>
        </div>
        {wallet && (
          <div className="flex gap-6 mt-4 text-sm text-blue-100">
            <span>Pending: {formatBDT(wallet.pendingBalance)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-6 mb-6">
        {actionBtns.map(b => (
          <Link key={b.href} href={b.href} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-2xl hover:bg-blue-100 transition-colors">{b.icon}</div>
            <span className="text-xs font-medium text-gray-600">{b.label}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Transaction History</h2>
        <TabBar tabs={[{ key: 'all', label: 'All' }, { key: 'credits', label: 'Credits' }, { key: 'debits', label: 'Debits' }]} active={tab} onChange={setTab} />

        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No transactions found</p>
        ) : (
          <div className="space-y-1">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${tx.direction === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.direction === 'CREDIT' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge text={tx.type.replace('_', ' ')} variant="info" />
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.direction === 'CREDIT' ? '+' : '-'}{formatBDT(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}
