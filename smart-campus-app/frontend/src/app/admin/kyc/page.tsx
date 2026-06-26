'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Badge, Pagination, Modal } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import adminNav from '../nav';

export default function KYCQueuePage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [decision, setDecision] = useState({ type: '', reason: '', notes: '' });

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/kyc/queue', { params: { page, limit: 25 } });
      setQueue(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, [page]);

  const submitDecision = async () => {
    if (decision.type === 'REJECTED' && !decision.reason) return show('Reason required for rejection', 'error');
    try {
      await api.put(`/admin/kyc/${selected.id}/decision`, { decision: decision.type, rejectionReason: decision.reason, notes: decision.notes });
      show(`KYC ${decision.type.toLowerCase()}`, 'success');
      setSelected(null); setDecision({ type: '', reason: '', notes: '' }); fetchQueue();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const columns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'kycStatus', label: 'Status', render: (v: any) => <Badge text={v} variant="warning" /> },
    { key: 'createdAt', label: 'Submitted', render: (v: any) => formatDate(v) },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/kyc" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">KYC Review Queue</h1>
      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={queue} onRowClick={setSelected} emptyMessage="No pending KYC applications" />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="KYC Review">
        {selected && (
          <div className="space-y-4">
            <div><h3 className="font-semibold">{selected.fullName}</h3><p className="text-sm text-gray-500">{selected.studentId} • {selected.email}</p></div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium mb-2">Submitted Documents:</p>
              {selected.kycDocuments?.length > 0 ? selected.kycDocuments.map((d: any) => (
                <div key={d.id} className="flex items-center gap-2 py-1"><span>📄</span><span className="text-sm">{d.docType}</span></div>
              )) : <p className="text-xs text-gray-400">No documents uploaded</p>}
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button className={`btn btn-sm flex-1 ${decision.type === 'APPROVED' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setDecision({...decision, type: 'APPROVED'})}>✓ Approve</button>
                <button className={`btn btn-sm flex-1 ${decision.type === 'REJECTED' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setDecision({...decision, type: 'REJECTED'})}>✗ Reject</button>
              </div>
              {decision.type === 'REJECTED' && <textarea className="input" rows={2} placeholder="Rejection reason (required)" value={decision.reason} onChange={e => setDecision({...decision, reason: e.target.value})} />}
              <textarea className="input" rows={2} placeholder="Notes (optional)" value={decision.notes} onChange={e => setDecision({...decision, notes: e.target.value})} />
              <button className="btn btn-primary w-full" disabled={!decision.type} onClick={submitDecision}>Confirm Decision</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
