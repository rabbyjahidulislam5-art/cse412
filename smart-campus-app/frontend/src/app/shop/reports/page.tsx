'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton, DataTable, Badge } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import shopNav from '../nav';

export default function ShopReportsPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await api.get('/shop/reports', { params: { range } });
      setData(r.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range]);

  const exportCSV = () => {
    if (!data?.dailyBreakdown) return;
    const csv = data.dailyBreakdown
      .map((d: any) => `${d.date},${d.count},${d.revenue / 100}`)
      .join('\n');
    const blob = new Blob([`Date,Transactions,Revenue (BDT)\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `shop-report-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const topStudentsCols = [
    { key: 'studentId', label: 'Student ID', render: (v: any) => v || 'N/A' },
    { key: 'name', label: 'Name', render: (v: any) => v || '—' },
    { key: 'count', label: 'Visits', render: (v: any) => <span className="font-medium">{v}</span> },
    { key: 'total', label: 'Total Spent', render: (v: any) => <span className="font-semibold text-green-600">{formatBDT(v || 0)}</span> },
  ];

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/reports" userName={user?.fullName || ''} role="Shop Owner" onLogout={logout}>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${range === r ? 'bg-white shadow-sm font-medium text-blue-600' : 'text-gray-500'}`}
              >
                {r === 'all' ? 'All Time' : r.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📥 Export</button>
        </div>
      </div>

      {loading ? <LoadingSkeleton lines={6} /> : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard title="Total Revenue" value={formatBDT(data.totalRevenue || 0)} icon="💰" color="green" />
            <KPICard title="Total Transactions" value={String(data.totalCount || 0)} icon="📊" color="blue" />
            <KPICard title="Avg. Order Value" value={formatBDT(data.averageOrderValue || 0)} icon="🧮" color="purple" />
            <KPICard title="Unique Students" value={String(data.uniqueStudents || 0)} icon="👥" color="amber" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Revenue Trend</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.dailyBreakdown?.slice().reverse().map((d: any, i: number) => {
                  const max = Math.max(...data.dailyBreakdown.map((x: any) => x.revenue), 1);
                  const pct = (d.revenue / max) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-24">{formatDate(d.date)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-20 text-right">{formatBDT(d.revenue || 0)}</span>
                    </div>
                  );
                })}
                {data.dailyBreakdown?.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No data for this period</p>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Peak Hours</h2>
              <div className="space-y-2">
                {data.peakHours?.map((h: any, i: number) => {
                  const max = Math.max(...data.peakHours.map((x: any) => x.count), 1);
                  const pct = (h.count / max) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 w-16">{h.hour}:00</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{h.count}</span>
                    </div>
                  );
                })}
                {(!data.peakHours || data.peakHours.length === 0) && (
                  <p className="text-gray-400 text-center py-8">No data</p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Top Students</h2>
            <DataTable
              columns={topStudentsCols}
              data={data.topStudents || []}
              emptyMessage="No student data"
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
