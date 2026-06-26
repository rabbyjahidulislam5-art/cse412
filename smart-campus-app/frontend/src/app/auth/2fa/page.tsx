'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function TwoFAPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/2fa/verify', { token: code });
      const { accessToken } = res.data.data;
      if (accessToken) {
        const profileRes = await api.get('/student/profile');
        login(accessToken, profileRes.data.data);
        router.push('/student/dashboard');
      }
    } catch (err: any) { setError(err.response?.data?.error?.message || 'Invalid code'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6"><span className="text-3xl">🔐</span></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
        <p className="text-gray-500 text-sm mb-6">Enter the code from your authenticator app</p>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 animate-shake">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input text-center text-2xl tracking-[0.5em] font-mono" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
          <button className="btn btn-primary w-full btn-lg" disabled={loading || code.length < 6}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
