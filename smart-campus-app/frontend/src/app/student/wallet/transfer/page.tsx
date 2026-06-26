'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import studentNav from '../nav';

export default function TransferPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [form, setForm] = useState({ recipient: '', amount: '', note: '' });
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      await api.post('/wallet/transfer', { recipientStudentId: form.recipient, amount: parseInt(form.amount) * 100, note: form.note });
      setStep('success');
      show('Transfer successful!', 'success');
    } catch (err: any) { show(err.response?.data?.error?.message || 'Transfer failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/wallet/transfer" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transfer Money</h1>
      <div className="max-w-lg">
        {step === 'form' && (
          <div className="card space-y-4">
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Recipient Student ID</label><input className="input" placeholder="2023-2-60-001" value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Amount (BDT)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">৳</span><input className="input text-xl font-bold pl-8" type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} min="10" max="5000" /></div><p className="text-xs text-gray-400 mt-1">Min ৳10 — Max ৳5,000 per transfer</p></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Note (optional)</label><input className="input" placeholder="What's this for?" value={form.note} onChange={e => setForm({...form, note: e.target.value})} /></div>
            <button className="btn btn-primary w-full btn-lg" disabled={!form.recipient || !form.amount} onClick={() => setStep('confirm')}>Review Transfer</button>
          </div>
        )}
        {step === 'confirm' && (
          <div className="card text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Transfer</h2>
            <div className="bg-gray-50 rounded-xl p-6 mb-6"><p className="text-sm text-gray-500">Amount</p><p className="text-3xl font-bold">৳{parseInt(form.amount).toLocaleString()}</p><p className="text-sm text-gray-500 mt-2">To: {form.recipient}</p></div>
            <div className="flex gap-3"><button className="btn btn-secondary flex-1" onClick={() => setStep('form')}>Cancel</button><button className="btn btn-primary flex-1" onClick={handleTransfer} disabled={loading}>{loading ? 'Processing...' : 'Confirm'}</button></div>
          </div>
        )}
        {step === 'success' && (
          <div className="card text-center animate-scale-in">
            <span className="text-5xl block mb-4">🎉</span><h2 className="text-xl font-bold text-green-700">Transfer Complete!</h2><p className="text-gray-500 mt-2">৳{form.amount} sent to {form.recipient}</p>
            <button className="btn btn-primary mt-6" onClick={() => { setStep('form'); setForm({recipient:'',amount:'',note:''}); }}>New Transfer</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
