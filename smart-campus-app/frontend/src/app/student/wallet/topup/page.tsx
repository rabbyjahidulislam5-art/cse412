'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import studentNav from '../nav';

export default function TopUpPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState('bkash');
  const [loading, setLoading] = useState(false);

  const presets = [100, 200, 500, 1000, 2000, 5000];

  const handleSubmit = async () => {
    const paisa = parseInt(amount) * 100;
    if (paisa < 5000) return show('Minimum ৳50', 'error');
    setLoading(true);
    try {
      const res = await api.post('/wallet/topup/initiate', { amount: paisa, gateway });
      const { gatewayRedirect, intentId } = res.data.data;
      // In production: redirect to gateway
      show(`Payment initiated! Redirecting to ${gateway}...`, 'success');
      setTimeout(() => {
        // Simulate success for demo
        api.post(`/payments/webhook/${gateway}`, { tran_id: intentId, status: 'VALID', val_id: 'demo', amount }).catch(() => {});
        router.push('/student/wallet');
      }, 2000);
    } catch (err: any) { show(err.response?.data?.error?.message || 'Top-up failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/wallet/topup" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Top Up Wallet</h1>

      <div className="max-w-lg">
        <div className="card mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Amount (BDT)</label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">৳</span>
            <input className="input text-2xl font-bold pl-8 text-right" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} min="50" max="10000" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map(p => (
              <button key={p} onClick={() => setAmount(String(p))} className={`py-2 rounded-lg text-sm font-medium border transition-all ${amount === String(p) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-blue-300'}`}>
                ৳{p}
              </button>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-3">Payment Method</label>
          <div className="space-y-3">
            {[
              { key: 'bkash', label: 'bKash', icon: '📱', color: 'bg-pink-50 border-pink-200' },
              { key: 'nagad', label: 'Nagad', icon: '📱', color: 'bg-orange-50 border-orange-200' },
              { key: 'sslcommerz', label: 'Card Payment', icon: '💳', color: 'bg-blue-50 border-blue-200' },
            ].map(g => (
              <label key={g.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${gateway === g.key ? 'border-blue-600 bg-blue-50' : g.color}`}>
                <input type="radio" name="gateway" value={g.key} checked={gateway === g.key} onChange={e => setGateway(e.target.value)} className="accent-blue-600" />
                <span className="text-xl">{g.icon}</span>
                <span className="text-sm font-medium">{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary w-full btn-lg" onClick={handleSubmit} disabled={loading || !amount}>
          {loading ? 'Processing...' : `Top Up ৳${amount}`}
        </button>
      </div>
    </DashboardLayout>
  );
}
