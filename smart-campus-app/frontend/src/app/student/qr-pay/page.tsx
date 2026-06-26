'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import studentNav from '../nav';

export default function QRPayPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [qrData, setQrData] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'scan' | 'confirm' | 'success'>('scan');
  const [merchantInfo, setMerchantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);

  const processPayment = async () => {
    setLoading(true);
    try {
      const res = await api.post('/wallet/qr-pay', { qrPayload: qrData, amount: parseInt(amount) * 100 });
      setTxResult(res.data.data);
      setStep('success');
      show('Payment successful!', 'success');
    } catch (err: any) {
      show(err.response?.data?.error?.message || 'Payment failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/qr-pay" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">QR Pay</h1>

      <div className="max-w-lg mx-auto">
        {step === 'scan' && (
          <div className="card text-center">
            <div className="w-64 h-64 mx-auto border-4 border-blue-600 rounded-2xl flex items-center justify-center bg-gray-50 mb-6 relative">
              <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-lg"></div>
              <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-lg"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-lg"></div>
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-lg"></div>
              <div className="text-center">
                <span className="text-4xl block mb-2">📷</span>
                <p className="text-sm text-gray-500">Camera Scanner</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Or enter QR code manually:</p>
              <textarea className="input text-sm" rows={3} placeholder="Paste QR payload here..." value={qrData} onChange={e => setQrData(e.target.value)} />
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Amount (BDT)</label>
                <input className="input text-xl font-bold text-center" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full btn-lg mt-4" disabled={!qrData || !amount} onClick={() => setStep('confirm')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="card text-center">
            <span className="text-4xl block mb-4">🏪</span>
            <h2 className="text-lg font-semibold">Confirm Payment</h2>
            <p className="text-gray-500 text-sm mb-6">Review the payment details</p>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-3xl font-bold text-gray-900">৳{parseInt(amount || '0').toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setStep('scan')}>Cancel</button>
              <button className="btn btn-primary flex-1 btn-lg" onClick={processPayment} disabled={loading}>
                {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : `Pay ৳${amount}`}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="card text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 text-sm mb-1">Transaction ID: {txResult?.transaction?.referenceId || 'N/A'}</p>
            <p className="text-gray-500 text-sm mb-6">Amount: ৳{amount}</p>
            <div className="flex gap-3">
              <button className="btn btn-primary flex-1" onClick={() => { setStep('scan'); setQrData(''); setAmount(''); }}>Scan Again</button>
              <a href="/student/wallet" className="btn btn-secondary flex-1">View Wallet</a>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
