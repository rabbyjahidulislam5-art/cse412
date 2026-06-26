'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton, Badge } from '@/components/UI';
import { useCountUp } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const balance = useCountUp(data ? Number(data.wallet?.balance) / 100 : 0, 400);

  useEffect(() => {
    api.get('/student/dashboard').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const navItems = [
    { label: 'Home', icon: '🏠', href: '/student/dashboard', badge: data?.unreadNotifications },
    { label: 'Wallet', icon: '💳', href: '/student/wallet' },
    { label: 'QR Pay', icon: '📷', href: '/student/qr-pay' },
    { label: 'Fines', icon: '📋', href: '/student/fines' },
    { label: 'Advising', icon: '🎓', href: '/student/advising' },
    { label: 'Profile', icon: '👤', href: '/student/profile' },
    { label: 'Support', icon: '💬', href: '/student/support' },
    { label: 'Settings', icon: '⚙️', href: '/student/settings' },
  ];

  if (loading) return <DashboardLayout navItems={navItems} activePath="/student/dashboard" userName="" role="Student" onLogout={logout}><LoadingSkeleton lines={8} /></DashboardLayout>;

  const isHold = data?.advisingStatus === 'HOLD';

  return (
    <DashboardLayout navItems={navItems} activePath="/student/dashboard" userName={user?.fullName || 'Student'} role="Student" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {isHold && (
        <div className="status-card danger mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div><p className="font-semibold text-red-800">Course Advising ON HOLD</p><p className="text-sm text-red-600">{data?.blockedReason}</p></div>
            <Link href="/student/fines" className="btn btn-danger btn-sm ml-auto">Pay Now</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KPICard title="Wallet Balance" value={`৳ ${balance.toLocaleString()}`} icon="💳" color="blue" />
        <KPICard title="Pending Dues" value={formatBDT(data?.totalFinesDue || 0)} icon="📋" color={data?.totalFinesDue > 0 ? 'red' : 'green'} />
        <KPICard title="Advising" value={data?.advisingStatus || 'N/A'} icon="🎓" color={isHold ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: '➕', label: 'Top Up', href: '/student/wallet/topup', color: 'bg-blue-50 text-blue-700' },
          { icon: '📋', label: 'Pay Fines', href: '/student/fines', color: 'bg-red-50 text-red-700' },
          { icon: '📊', label: 'Ledger', href: '/student/ledger', color: 'bg-green-50 text-green-700' },
          { icon: '📷', label: 'QR Pay', href: '/student/qr-pay', color: 'bg-purple-50 text-purple-700' },
          { icon: '🎓', label: 'Advising', href: '/student/advising', color: 'bg-amber-50 text-amber-700' },
          { icon: '💬', label: 'Support', href: '/student/support', color: 'bg-indigo-50 text-indigo-700' },
        ].map(q => (
          <Link key={q.href} href={q.href} className={`${q.color} rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all`}>
            <span className="text-2xl">{q.icon}</span>
            <span className="text-sm font-medium">{q.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/student/wallet/history" className="text-sm text-blue-600 font-medium">View All</Link>
          </div>
          {data?.recentTransactions?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.direction === 'CREDIT' ? '+' : '-'}{formatBDT(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Active Fines</h2>
          {data?.activeFines?.length === 0 ? (
            <div className="text-center py-8"><span className="text-4xl block mb-2">✅</span><p className="text-green-600 font-medium">No active fines!</p></div>
          ) : (
            <div className="space-y-3">
              {data.activeFines.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <Badge text={f.type} variant={f.type === 'LIBRARY' ? 'danger' : 'warning'} />
                    <p className="text-sm text-gray-600 mt-1">{f.description}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatBDT(f.accumulatedAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
