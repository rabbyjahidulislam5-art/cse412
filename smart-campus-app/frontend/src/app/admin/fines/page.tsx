'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, LoadingSkeleton, Badge, Pagination, Modal, ConfirmModal } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import adminNav from '../nav';

export default function AdminFinesPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [addModal, setAddModal] = useState(false);
  const [waiveModal, setWaiveModal] = useState<string | null>(null);
  const [form, setForm] = useState({ studentId: '', type: 'DISCIPLINARY', description: '', amount: '' });

  const fetchFines = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/fines', { params: { page, limit: 25 } });
      setFines(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchFines(); }, [page]);

  const addFine = async () => {
    try {
      await api.post('/admin/fines', { ...form, amount: parseInt(form.amount) * 100 });
      show('Fine added', 'success'); setAddModal(false); setForm({ studentId: '', type: 'DISCIPLINARY', description: '', amount: '' }); fetchFines();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const waiveFine = async (id: string) => {
    try {
      await api.post(`/admin/fines/${id}/waive`, { reason: 'Administrative waiver' });
      show('Fine waived', 'success'); setWaiveModal(null); fetchFines();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const columns = [
    { key: 'type', label: 'Type', render: (v: any) => <Badge text={v} variant={v === 'LIBRARY' ? 'danger' : 'warning'} /> },
    { key: 'description', label: 'Description' },
    { key: 'accumulatedAmount', label: 'Amount', render: (v: any) => formatBDT(v) },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'PAID' || v === 'WAIVED' ? 'success' : v === 'ACTIVE' ? 'danger' : 'warning'} /> },
    { key: 'createdAt', label: 'Created', render: (v: any) => formatDate(v) },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/fines" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <ToastComponent />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fine Management</h1>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add Fine</button>
      </div>

      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={fines} onRowClick={(f) => f.status === 'ACTIVE' && setWaiveModal(f.id)} />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Manual Fine">
        <div className="space-y-3">
          <input className="input" placeholder="Student ID (e.g. 2023-2-60-001)" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} />
          <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="DISCIPLINARY">Disciplinary</option><option value="LIBRARY">Library</option><option value="TUITION_LATE">Tuition Late</option><option value="OTHER">Other</option>
          </select>
          <textarea className="input" rows={2} placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <input className="input" type="number" placeholder="Amount (BDT)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <button className="btn btn-primary w-full" onClick={addFine}>Add Fine</button>
        </div>
      </Modal>

      {waiveModal && <ConfirmModal open={!!waiveModal} onClose={() => setWaiveModal(null)} title="Waive Fine" message="Waive this fine? This action will be logged." confirmText="Waive" onConfirm={() => waiveFine(waiveModal!)} />}
    </DashboardLayout>
  );
}
