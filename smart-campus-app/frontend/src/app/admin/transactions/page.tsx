'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Badge, Pagination, SearchBar, SelectFilter, Modal } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import adminNav from '../nav';

export default function TransactionsPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const fetchTx = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (type) params.type = type;
      if (flagged) params.flagged = 'true';
      const r = await api.get('/admin/transactions', { params });
      setTransactions(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTx(); }, [type, flagged, page]);

  const override = async (action: string) => {
    try {
      await api.post(`/admin/transaction/${selected.id}/override`, { action, reason: 'Admin review' });
      show(`Transaction ${action}`, 'success'); setSelected(null); fetchTx();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const columns = [
    { key: 'referenceId', label: 'Reference', render: (v: any) => <span className="font-mono text-xs">{v}</span> },
    { key: 'type', label: 'Type', render: (v: any) => <Badge text={v.replace('_', ' ')} variant="info" /> },
    { key: 'amount', label: 'Amount', render: (v: any) => formatBDT(v) },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'COMPLETED' ? 'success' : v === 'FAILED' ? 'danger' : 'warning'} /> },
    { key: 'flagged', label: 'Flag', render: (v: any) => v ? <Badge text="FLAGGED" variant="danger" /> : '' },
    { key: 'createdAt', label: 'Time', render: (v: any) => formatDateTime(v) },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/transactions" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Monitor</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <SelectFilter label="" options={[{ value: '', label: 'All Types' }, { value: 'TOP_UP', label: 'Top Up' }, { value: 'PAYMENT', label: 'Payment' }, { value: 'TRANSFER_OUT', label: 'Transfer' }, { value: 'FINE_PAYMENT', label: 'Fine' }, { value: 'WITHDRAWAL', label: 'Withdrawal' }]} value={type} onChange={setType} />
        <button className={`btn btn-sm ${flagged ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFlagged(!flagged)}>{flagged ? '⚠️ Showing Flagged Only' : 'Show Flagged'}</button>
      </div>

      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={transactions} onRowClick={setSelected} />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Detail">
        {selected && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Reference ID</p>
              <p className="font-mono text-sm">{selected.referenceId}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Amount</span>{formatBDT(selected.amount)}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Type</span>{selected.type}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Direction</span>{selected.direction}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Status</span>{selected.status}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Gateway</span>{selected.gateway || 'N/A'}</div>
              <div className="bg-gray-50 p-3 rounded-lg col-span-2"><span className="text-gray-500 block">Description</span>{selected.description}</div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button className="btn btn-success btn-sm flex-1" onClick={() => override('clear')}>Mark Cleared</button>
              <button className="btn btn-danger btn-sm flex-1" onClick={() => override('flag')}>Flag</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
