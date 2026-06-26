'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { LoadingSkeleton, DataTable, Badge, EmptyState, Pagination } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatDateTime, maskIp } from '@/lib/utils';
import studentNav from '../nav';

export default function StudentSecurityPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [log, setLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await api.get('/student/security/activity', { params: { page, limit: 30 } });
      setLog(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page]);

  const revokeAll = async () => {
    if (!confirm('This will log you out from ALL other devices. Continue?')) return;
    try {
      await api.post('/student/security/revoke-session', { revokeAll: true });
      toast.show('All other sessions revoked', 'success');
      fetchData();
    } catch (e: any) {
      toast.show(e.response?.data?.error?.message || 'Failed', 'error');
    }
  };

  const deviceIcon = (ua: string) => {
    if (/mobile|android|iphone/i.test(ua)) return '📱';
    if (/mac|windows|linux/i.test(ua)) return '💻';
    return '🌐';
  };

  const logColumns = [
    { key: 'event', label: 'Event', render: (v: any) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'ipAddress', label: 'IP Address', render: (v: any) => <span className="font-mono text-xs text-gray-500">{maskIp(v)}</span> },
    { key: 'deviceInfo', label: 'Device', render: (v: any) => <span className="text-sm">{deviceIcon(v || '')} {v?.substring(0, 40) || 'Unknown'}</span> },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'SUCCESS' ? 'success' : 'danger'} /> },
    { key: 'createdAt', label: 'Time', render: (v: any) => <span className="text-sm text-gray-500">{formatDateTime(v)}</span> },
  ];

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/security" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <toast.ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Security & Activity</h1>
      <p className="text-sm text-gray-500 mb-6">Monitor your login history and security events</p>

      <div className="space-y-6">
        {/* Quick actions */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Session Control</h2>
              <p className="text-sm text-gray-500">Manage your active sessions across devices</p>
            </div>
            <button className="btn btn-secondary btn-sm text-red-600" onClick={revokeAll}>
              🚪 Revoke All Other Sessions
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-2xl">💻</span>
            <div>
              <p className="font-medium text-sm text-gray-800">
                Current Session — This Device
                <span className="ml-2 text-xs text-green-600 font-medium">Active</span>
              </p>
              <p className="text-xs text-gray-400">You are currently logged in</p>
            </div>
          </div>
        </div>

        {/* Activity log */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Activity Log</h2>
          {loading ? <LoadingSkeleton lines={8} /> : log.length === 0 ? (
            <EmptyState icon="📋" title="No activity yet" description="Your login and security events will show here." />
          ) : (
            <>
              <DataTable columns={logColumns} data={log} emptyMessage="No activity" />
              <Pagination page={page} totalPages={Math.ceil(total / 30)} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
