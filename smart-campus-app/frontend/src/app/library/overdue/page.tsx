'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, Pagination, LoadingSkeleton, Badge, useToast } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import libraryNav from '../nav';

export default function OverduePage() {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const r = await api.get('/library/overdue', { params: { page, limit: 25 } });
      setOverdue(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOverdue(); }, [page]);

  const remind = async (id: string) => {
    try { await api.post(`/library/overdue/${id}/remind`); show('Reminder sent!', 'success'); fetchOverdue(); }
    catch { show('Failed to send', 'error'); }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (v: any) => v?.fullName || 'N/A' },
    { key: 'book', label: 'Book', render: (v: any) => v?.title || 'N/A' },
    { key: 'dueDate', label: 'Due Date', render: (v: any) => formatDate(v) },
    { key: 'fine', label: 'Fine', render: (v: any) => v ? <span className="font-bold text-red-600">{formatBDT(v.accumulatedAmount)}</span> : <Badge text="None" variant="success" /> },
    { key: 'reminderCount', label: 'Reminders', render: (v: any) => String(v || 0) },
  ];

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/overdue" userName={user?.fullName || ''} role="Library Staff" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overdue Tracker</h1>
      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={overdue} emptyMessage="No overdue books 🎉" onRowClick={(row) => remind(row.id)} />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
          <p className="text-xs text-gray-400 mt-2 text-center">Click any row to send an overdue reminder</p>
        </>
      )}
    </DashboardLayout>
  );
}
