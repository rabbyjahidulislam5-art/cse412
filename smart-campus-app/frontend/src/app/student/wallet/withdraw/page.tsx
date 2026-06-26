'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import studentNav from '../../nav';

export default function WithdrawPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [balance, setBalance] = useState(0);
  const [form, setForm] = useState({ amount: '', destination: '', password: '' });
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/wallet/balance').then(r => setBalance(r.data.data.balance || 0)).catch(() => {});
  }, []);

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await api.post('/wallet/withdraw', {
        amount: parseInt(form.amount) * 100,
        destination: form.destination,
        password: form.password,
      });
      setStep('success');
      show('Withdrawal requested!', 'success');
      // Refresh balance
      api.get('/wallet/balance').then(r => setBalance(r.data.data.balance || 0)).catch(() => {});
    } catch (err: any) {
      show(err.response?.data?.error?.message || 'Withdrawal failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/wallet/withdraw" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Withdraw Money</h1>
      <p className="text-sm text-gray-500 mb-6">Send wallet balance to your mobile banking account</p>

      <div className="max-w-lg">
        {/* Balance banner */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-800 text-white rounded-2xl p-5 mb-6">
          <p className="text-blue-200 text-sm">Available Balance</p>
          <p className="text-3xl font-bold">{formatBDT(balance)}</p>
        </div>

        {step === 'form' && (
          <div className="card space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Amount (BDT)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">৳</span>
                <input
                  className="input text-xl font-bold pl-8"
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  min="100"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Min ৳100 — Withdrawal fee ৳10</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Destination Account</label>
              <input
                className="input"
                placeholder="bKash / Nagad / Bank account number"
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">e.g. 01XXXXXXXXX or bank account number</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirm with Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your account password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Required for security verification</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
              ⚠️ Withdrawals are processed within 24–48 hours.
            </div>

            <button
              className="btn btn-primary w-full btn-lg"
              disabled={!form.amount || !form.destination || !form.password || parseInt(form.amount) < 100 || loading}
              onClick={handleWithdraw}
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="card text-center animate-scale-in">
            <span className="text-5xl block mb-4">✅</span>
            <h2 className="text-xl font-bold text-green-700">Withdrawal Requested!</h2>
            <p className="text-gray-500 mt-2">
              ৳{form.amount} will be sent to your account within 24–48 hours.
            </p>
            <button className="btn btn-primary mt-6" onClick={() => {
              setStep('form'); setForm({ amount: '', destination: '', password: '' });
            }}>
              Done
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
