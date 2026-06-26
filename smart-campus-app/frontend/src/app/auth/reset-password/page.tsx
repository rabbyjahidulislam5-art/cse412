'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.show('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      toast.show('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: code,
        newPassword: password,
      });
      setDone(true);
      toast.show('Password reset successful!', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error?.message || 'Failed to reset password', 'error');
    } finally { setLoading(false); }
  };

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'][strength];

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="card animate-scale-in">
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-xl font-bold text-green-700 mb-2">Password Reset Successfully!</h2>
            <p className="text-gray-500 mb-6">You can now log in with your new password.</p>
            <Link href="/auth/login" className="btn btn-primary w-full btn-lg block text-center">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <toast.ToastComponent />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔑 Reset Password</h1>
          <p className="text-gray-500 mt-2">Smart Campus App — East West University</p>
        </div>

        <div className="card">
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
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">6-Digit Recovery Code</label>
              <input
                className="input text-center text-2xl tracking-[0.5em] font-bold"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Enter the code sent to your email</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${strength >= 4 ? 'text-green-600' : strength >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={!email || code.length !== 6 || !password || password !== confirmPassword || loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
              Didn&apos;t receive the code?
            </Link>
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
