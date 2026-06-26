'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { KPICard, LoadingSkeleton, Modal } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import shopNav from '../nav';

export default function ShopSettlementPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [form, setForm] = useState({ amount: '', destination: '', password: '' });

  const fetchData = async () => {
    try { const r = await api.get('/shop/settlement'); setData(r.data.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const requestWithdrawal = async () => {
    try {
      await api.post('/shop/withdrawal', { amount: parseInt(form.amount) * 100, destination: form.destination, password: form.password });
      show('Withdrawal requested!', 'success');
      setWithdrawModal(false); setForm({ amount: '', destination: '', password: '' }); fetchData();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  if (loading) return <DashboardLayout navItems={shopNav} activePath="/shop/settlement" userName="" role="Shop" onLogout={logout}><LoadingSkeleton lines={4} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/settlement" userName={user?.fullName || ''} role="Shop Owner" onLogout={logout}>
      <ToastComponent />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settlement</h1>
        <button className="btn btn-primary" onClick={() => setWithdrawModal(true)}>Request Withdrawal</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Available Balance" value={formatBDT(data?.availableBalance || 0)} icon="✅" color="green" />
        <KPICard title="Pending Settlement" value={formatBDT(data?.pendingBalance || 0)} icon="⏳" color="amber" />
        <KPICard title="Daily Volume" value={formatBDT(data?.dailyVolume || 0)} icon="📊" color="blue" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">How Settlement Works</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>📋 <strong>Daily Settlement:</strong> All payments received today are settled to your available balance at 11:59 PM.</p>
          <p>💸 <strong>Withdrawals:</strong> Request withdrawal of your available balance to your linked bKash or bank account.</p>
          <p>⏱️ <strong>Processing Time:</strong> Auto-approved for amounts under ৳10,000. Above requires admin review. Processed same business day if before 2 PM.</p>
        </div>
      </div>

      <Modal open={withdrawModal} onClose={() => setWithdrawModal(false)} title="Request Withdrawal">
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500">Available</p><p className="text-xl font-bold text-green-600">{formatBDT(data?.availableBalance || 0)}</p></div>
          <input className="input" type="number" placeholder="Amount (BDT)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <input className="input" placeholder="Destination (bKash / Bank Account)" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <button className="btn btn-primary w-full" onClick={requestWithdrawal}>Submit Request</button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
