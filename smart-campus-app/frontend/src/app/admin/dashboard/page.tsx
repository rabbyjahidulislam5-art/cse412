'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton, Badge } from '@/components/UI';
import { useCountUp } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import adminNav from './nav';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const txVolume = useCountUp(data ? Number(data.todayTxVolume) / 100 : 0, 400);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout navItems={adminNav} activePath="/admin/dashboard" userName="" role="Admin" onLogout={logout}><LoadingSkeleton lines={8} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/dashboard" userName={user?.fullName || 'Admin'} role="Admin" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard title="Total Students" value={String(data?.totalStudents || 0)} icon="👨‍🎓" color="blue" />
        <KPICard title="Active Wallets" value={String(data?.activeWallets || 0)} icon="💰" color="green" />
        <KPICard title="Today's Volume" value={`৳${txVolume.toLocaleString()}`} icon="💳" color="purple" />
        <KPICard title="Pending KYC" value={String(data?.pendingKYC || 0)} icon="✅" color="amber" />
        <KPICard title="Open Tickets" value={String(data?.openTickets || 0)} icon="💬" color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '📋', label: 'Add Fine', href: '/admin/fines' },
              { icon: '📢', label: 'Broadcast', href: '/admin/notifications' },
              { icon: '✅', label: 'Review KYC', href: '/admin/kyc' },
              { icon: '📈', label: 'Reports', href: '/admin/reports' },
              { icon: '🛡️', label: 'Security', href: '/admin/security' },
              { icon: '⚙️', label: 'Settings', href: '/admin/settings' },
            ].map(a => (
              <a key={a.href} href={a.href} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors">
                <span className="text-xl">{a.icon}</span><span className="text-sm font-medium">{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          {data?.recentAlerts?.length === 0 ? <p className="text-gray-400 text-sm">No alerts</p> : (
            <div className="space-y-2">
              {data.recentAlerts.slice(0, 8).map((alert: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <Badge text={alert.severity || 'INFO'} variant={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'info'} />
                  <div>
                    <p className="text-xs text-gray-700">{alert.eventType}</p>
                    <p className="text-[10px] text-gray-400">{formatDateTime(alert.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
