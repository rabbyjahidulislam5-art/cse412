'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import shopNav from '../nav';

export default function ShopQRPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [qrUrl, setQrUrl] = useState('');
  const [mode, setMode] = useState<'static' | 'dynamic'>('static');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQR = async () => {
    setLoading(true);
    try {
      const r = await api.get('/shop/qr');
      setQrUrl(r.data.data.qrDataURL);
    } catch {} finally { setLoading(false); }
  };

  const generateDynamic = async () => {
    if (!amount) return show('Enter amount first', 'error');
    try {
      const r = await api.post('/shop/qr/dynamic', { amount: parseInt(amount) * 100 });
      setQrUrl(r.data.data.qrDataURL);
      setMode('dynamic');
      show('Dynamic QR generated (60s expiry)', 'success');
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a'); a.href = qrUrl; a.download = 'merchant-qr.png'; a.click();
    show('QR downloaded', 'success');
  };

  useEffect(() => { fetchQR(); }, []);

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/qr" userName={user?.fullName || ''} role="Shop Owner" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">QR Code</h1>

      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <div className="flex gap-2 mb-6 justify-center">
            <button className={`btn btn-sm ${mode === 'static' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setMode('static'); fetchQR(); }}>Static QR</button>
            <button className={`btn btn-sm ${mode === 'dynamic' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('dynamic')}>Dynamic QR</button>
          </div>

          {mode === 'dynamic' && (
            <div className="mb-4">
              <input className="input text-center text-xl font-bold" type="number" placeholder="Amount (BDT)" value={amount} onChange={e => setAmount(e.target.value)} />
              <button className="btn btn-primary btn-sm mt-2" onClick={generateDynamic}>Generate</button>
            </div>
          )}

          {loading ? (
            <div className="w-64 h-64 mx-auto skeleton rounded-2xl mb-4"></div>
          ) : qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-64 h-64 mx-auto rounded-2xl mb-4" />
          ) : (
            <div className="w-64 h-64 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center text-6xl mb-4">📱</div>
          )}

          <p className="text-sm text-gray-500 mb-4">{mode === 'static' ? 'Permanent QR — students scan and enter amount' : 'Time-limited QR — expires in 60 seconds'}</p>

          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={downloadQR}>📥 Download</button>
            <button className="btn btn-primary btn-sm" onClick={fetchQR}>🔄 Regenerate</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
