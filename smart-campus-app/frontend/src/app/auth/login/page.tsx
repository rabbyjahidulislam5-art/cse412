'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ studentId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      const { accessToken, requires2FA, token: twoFAToken, user } = res.data.data;
      if (requires2FA) {
        localStorage.setItem('access_token', twoFAToken);
        router.push('/auth/2fa');
      } else if (accessToken && user) {
        login(accessToken, user);
        const role = user.role.toLowerCase().replace('_', '');
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'librarystaff') router.push('/library/dashboard');
        else if (role === 'shopowner') router.push('/shop/dashboard');
        else router.push('/student/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      setError(msg || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">SC</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Login to Smart Campus App</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg animate-shake">{error}</div>}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Student ID</label>
            <input className="input" placeholder="2023-2-60-053" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input className="input" type="password" placeholder="Enter password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
          </div>

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Login'}
          </button>

          <p className="text-center text-sm text-gray-500">New here? <Link href="/auth/signup" className="text-blue-600 font-medium">Create Account</Link></p>
        </form>
      </div>
    </div>
  );
}
