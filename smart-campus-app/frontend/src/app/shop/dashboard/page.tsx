'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton } from '@/components/UI';
import { useCountUp, usePolling } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import shopNav from '../nav';
import Link from 'next/link';

export default function ShopDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const r = await api.get('/shop/dashboard'); setData(r.data.data); } catch {} finally { setLoading(false); }
  };

  usePolling(fetchData, 10000);

  const todayRevenue = useCountUp(data ? Number(data.todayRevenue) / 100 : 0, 400);

  if (loading) return <DashboardLayout navItems={shopNav} activePath="/shop/dashboard" userName="" role="Shop" onLogout={logout}><LoadingSkeleton lines={6} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/dashboard" userName={user?.fullName || 'Merchant'} role="Shop Owner" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Merchant Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Today's Revenue" value={`৳${todayRevenue.toLocaleString()}`} icon="💰" color="green" />
        <KPICard title="Transactions" value={String(data?.todayTxCount || 0)} icon="📊" color="blue" />
        <KPICard title="Pending Settlement" value={formatBDT(data?.pendingBalance || 0)} icon="⏳" color="amber" />
        <KPICard title="Available" value={formatBDT(data?.availableBalance || 0)} icon="✅" color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <h2 className="font-semibold text-gray-900 mb-3">Your QR Code</h2>
          <div className="w-32 h-32 mx-auto bg-gray-100 rounded-xl flex items-center justify-center text-4xl mb-3">📱</div>
          <Link href="/shop/qr" className="btn btn-primary btn-sm">Show QR</Link>
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Live Transaction Feed</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data?.recentTransactions?.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions yet</p>
            ) : (
              data?.recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg animate-slide-down">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">↓</span>
                    <div>
                      <p className="text-sm font-medium">{tx.transaction?.wallet?.user?.studentId || 'Student'}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">+{formatBDT(tx.settlementAmount || 0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
