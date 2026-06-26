'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.show('Recovery code sent to your email', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error?.message || 'Failed to send recovery code', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <toast.ToastComponent />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔐 Forgot Password</h1>
          <p className="text-gray-500 mt-2">Smart Campus App — East West University</p>
        </div>

        <div className="card">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your registered email address. We&apos;ll send a recovery code to reset your password.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="student@ewubd.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full btn-lg"
                  disabled={!email || loading}
                >
                  {loading ? 'Sending...' : 'Send Recovery Code'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <span className="text-5xl block mb-4">📧</span>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-sm text-gray-500 mb-2">
                We sent a 6-digit recovery code to
              </p>
              <p className="font-semibold text-blue-600 mb-6">{email}</p>
              <p className="text-sm text-gray-400 mb-6">
                The code expires in 5 minutes. Check your spam folder if you don&apos;t see it.
              </p>
              <Link href="/auth/reset-password" className="btn btn-primary w-full btn-lg block text-center">
                Enter Recovery Code
              </Link>
              <button
                className="text-sm text-blue-600 hover:text-blue-800 mt-3 block mx-auto"
                onClick={() => { setSent(false); setEmail(''); }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
