'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { LoadingSkeleton, EmptyState, Badge, Pagination } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatDateTime, timeAgo } from '@/lib/utils';
import studentNav from '../nav';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  createdAt: string;
  readAt: string | null;
}

export default function StudentNotificationsPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (filter === 'unread') params.unread = true;
      if (filter === 'read') params.read = true;
      const r = await api.get('/student/notifications', { params });
      setNotifications(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [page, filter]);

  const markRead = async (id: string) => {
    // Optimistic local update; persist via read-all endpoint
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    try {
      await api.put('/student/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ', readAt: n.readAt || new Date().toISOString() })));
      toast.show('All notifications marked as read', 'success');
    } catch (e: any) {
      toast.show(e.response?.data?.error?.message || 'Failed', 'error');
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return '💰';
      case 'FINE': return '📋';
      case 'LIBRARY': return '📚';
      case 'SYSTEM': return '⚙️';
      case 'SECURITY': return '🔒';
      case 'ANNOUNCEMENT': return '📢';
      default: return '📩';
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'border-l-green-400 bg-green-50';
      case 'FINE': return 'border-l-red-400 bg-red-50';
      case 'LIBRARY': return 'border-l-blue-400 bg-blue-50';
      case 'SYSTEM': return 'border-l-gray-400 bg-gray-50';
      case 'SECURITY': return 'border-l-amber-400 bg-amber-50';
      case 'ANNOUNCEMENT': return 'border-l-purple-400 bg-purple-50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/notifications" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <toast.ToastComponent />
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'unread', 'read'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 text-sm rounded-md transition capitalize ${filter === f ? 'bg-white shadow-sm font-medium text-blue-600' : 'text-gray-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>✓ All Read</button>
        </div>
      </div>

      {loading ? <LoadingSkeleton lines={6} /> : (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="No notifications"
              message={filter === 'unread' ? "You're all caught up!" : "Notifications will appear here."}
            />
          ) : notifications.map(n => (
            <div
              key={n.id}
              onClick={() => n.status !== 'READ' && markRead(n.id)}
              className={`card border-l-4 cursor-pointer transition hover:shadow-md ${typeColor(n.type)} ${n.status === 'READ' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{n.title}</h3>
                    {n.status !== 'READ' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <Badge text={n.type} variant="default" />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
          {total > 25 && (
            <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
