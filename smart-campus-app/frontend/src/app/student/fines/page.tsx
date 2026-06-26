'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge, EmptyState, LoadingSkeleton, ConfirmModal, SuccessModal } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import studentNav from '../nav';
import Modal from '@/components/Modal';

export default function FinesPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [fines, setFines] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; fineId?: string; amount?: number }>({ open: false });
  const [successModal, setSuccessModal] = useState(false);
  const [advisingHold, setAdvisingHold] = useState(false);

  const fetchFines = async () => {
    try {
      const res = await api.get('/fines');
      setFines(res.data.data.fines || []);
      setTotal(res.data.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchFines(); }, []);

  const payFine = async (fineId: string) => {
    try {
      await api.post(`/fines/${fineId}/pay`);
      show('Fine paid successfully!', 'success');
      setConfirmModal({ open: false });
      setSuccessModal(true);
      fetchFines();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Payment failed', 'error'); }
  };

  const payAll = async () => {
    try {
      await api.post('/fines/pay-all');
      show('All fines paid!', 'success');
      setConfirmModal({ open: false });
      setSuccessModal(true);
      fetchFines();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Payment failed', 'error'); }
  };

  const activeFines = fines.filter(f => f.status === 'ACTIVE' || f.status === 'APPEALED');

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/fines" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fine Management</h1>

      {advisingHold && (
        <div className="status-card danger mb-6">
          <p className="text-sm text-red-800">⚠️ Your course advising is ON HOLD because of unpaid fines. Pay all fines to unlock.</p>
        </div>
      )}

      {loading ? <LoadingSkeleton lines={6} /> : activeFines.length === 0 ? (
        <EmptyState icon="✅" title="No Active Fines" description="Great work! You have no outstanding fines." action={{ label: 'Go to Dashboard', onClick: () => {} }} />
      ) : (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Active Fines</h2>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500">Total:</span>
              <span className="text-sm font-bold text-red-600">{formatBDT(total)}</span>
              <button className="btn btn-primary btn-sm" onClick={() => setConfirmModal({ open: true })}>Pay All</button>
            </div>
          </div>
          <div className="space-y-3">
            {activeFines.map(fine => (
              <div key={fine.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge text={fine.type} variant={fine.type === 'LIBRARY' ? 'danger' : 'warning'} />
                    <Badge text={fine.status} variant={fine.status === 'APPEALED' ? 'purple' : 'danger'} />
                  </div>
                  <p className="text-sm text-gray-700">{fine.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Created: {formatDate(fine.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-600">{formatBDT(fine.accumulatedAmount)}</span>
                  {fine.status === 'ACTIVE' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setConfirmModal({ open: true, fineId: fine.id, amount: fine.accumulatedAmount })}>
                      Pay
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fines.filter(f => f.status === 'PAID' || f.status === 'WAIVED').length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Resolved Fines</h2>
          {fines.filter(f => f.status === 'PAID' || f.status === 'WAIVED').map(f => (
            <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div><Badge text={f.status} variant="success" /><p className="text-sm text-gray-600 mt-1">{f.description}</p></div>
              <span className="text-sm font-medium">{formatBDT(f.accumulatedAmount)}</span>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={confirmModal.open} onClose={() => setConfirmModal({ open: false })} title="Confirm Payment"
        message={`Pay ${confirmModal.fineId ? formatBDT(confirmModal.amount || 0) : formatBDT(total)} from your wallet?`}
        confirmText="Pay Now" onConfirm={() => confirmModal.fineId ? payFine(confirmModal.fineId!) : payAll()} />

      <SuccessModal open={successModal} onClose={() => setSuccessModal(false)} title="Payment Successful" message="Fine paid! Advising should now be unlocked." />
    </DashboardLayout>
  );
}
