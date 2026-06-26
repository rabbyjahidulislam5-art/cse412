'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';

export default function AccountLockedPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.show('Recovery email sent', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error?.message || 'Failed to send', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <toast.ToastComponent />
      <div className="w-full max-w-md">
        <div className="card text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Account Locked</h1>
          <p className="text-gray-500 mb-2">
            Your account has been temporarily locked due to too many failed login attempts.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Please try again after 30 minutes or reset your password using the option below.
          </p>

          {!sent ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1 text-left">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="student@ewubd.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={!email || loading}
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="animate-scale-in">
              <p className="text-sm text-green-600 font-medium mb-4">
                ✅ Recovery code sent to <strong>{email}</strong>
              </p>
              <Link href="/auth/reset-password" className="btn btn-primary w-full block text-center">
                Enter Recovery Code
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-400">
              If you believe your account was locked in error, please contact the IT help desk at{' '}
              <a href="mailto:it@ewubd.edu" className="text-blue-600 hover:underline">it@ewubd.edu</a>
            </p>
          </div>
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
