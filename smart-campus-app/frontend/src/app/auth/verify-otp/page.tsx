'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) return setError('Enter all 6 digits');
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { otp: code });
      router.push('/auth/kyc');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await api.post('/auth/register', {}); // Would need proper resend endpoint
      setCountdown(300);
    } catch { setError('Failed to resend OTP'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h1>
        <p className="text-gray-500 text-sm mb-8">Enter the 6-digit code sent to your email and phone</p>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 animate-shake">{error}</div>}

        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, i) => (
            <input key={i} ref={el => { inputRefs.current[i] = el; }}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button className="btn btn-primary w-full btn-lg" onClick={handleSubmit} disabled={loading || otp.join('').length < 6}>
          {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Verify'}
        </button>

        <p className="text-sm text-gray-500 mt-6">
          {countdown > 0 ? `Resend in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` :
            <button className="text-blue-600 font-medium" onClick={handleResend}>Resend OTP</button>}
        </p>
      </div>
    </div>
  );
}
