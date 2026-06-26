'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import { KPICard, LoadingSkeleton } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import adminNav from '../nav';

export default function ReportsPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      const r = await api.get('/admin/reports/financial', { params });
      setData(r.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  const exportReport = () => {
    if (!data) return;
    const csv = `Type,Amount,Count\n${data.transactions?.map((t: any) => `${t.type},${t._sum.amount},${t._count}`).join('\n') || ''}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'financial-report.csv'; a.click();
    show('Report downloaded', 'success');
  };

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/reports" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <ToastComponent />
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button className="btn btn-secondary btn-sm" onClick={exportReport}>📥 Export CSV</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div><label className="text-xs text-gray-500 block mb-1">Start Date</label><input type="date" className="input" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} /></div>
        <div><label className="text-xs text-gray-500 block mb-1">End Date</label><input type="date" className="input" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} /></div>
        <div className="flex items-end"><button className="btn btn-primary btn-sm" onClick={fetchReport}>Generate</button></div>
      </div>

      {loading ? <LoadingSkeleton lines={6} /> : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard title="Transaction Types" value={String(data.transactions?.length || 0)} icon="📊" color="blue" />
            <KPICard title="Fines Total" value={formatBDT(data.fineTotals?._sum?.accumulatedAmount || 0)} icon="📋" color="red" />
            <KPICard title="Merchant Pending" value={formatBDT(data.merchantTotals?._sum?.pendingBalance || 0)} icon="🏪" color="amber" />
            <KPICard title="Merchant Available" value={formatBDT(data.merchantTotals?._sum?.availableBalance || 0)} icon="💰" color="green" />
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Transaction Breakdown</h2>
            <div className="space-y-3">
              {data.transactions?.map((t: any) => (
                <div key={t.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><span className="font-medium">{t.type.replace('_', ' ')}</span><span className="text-xs text-gray-500 ml-2">({t._count} transactions)</span></div>
                  <span className="font-bold text-blue-600">{formatBDT(t._sum.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : <p className="text-gray-400 text-center py-8">No data available</p>}
    </DashboardLayout>
  );
}
