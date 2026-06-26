'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ studentId: '', fullName: '', email: '', phone: '', password: '', confirmPassword: '', department: '', semester: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^\d{4}-\d+-\d+-\d+$/.test(form.studentId)) e.studentId = 'Format: YYYY-S-DDD';
    if (!form.email.endsWith('@ewubd.edu') && !form.email.endsWith('@std.ewubd.edu')) e.email = 'Use university email';
    if (!/^(?:\+880|01)\d{9}$/.test(form.phone)) e.phone = 'Invalid BD phone';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (!/[A-Z]/.test(form.password)) e.password += ', uppercase';
    if (!/[0-9]/.test(form.password)) e.password += ', digit';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { ...form, semester: form.semester ? parseInt(form.semester) : undefined });
      if (res.data.data.token) { localStorage.setItem('access_token', res.data.data.token); router.push('/auth/verify-otp'); }
    } catch (err: any) {
      console.error("REGISTRATION ERROR:", err);
      const errMsg = err.response?.data?.error?.message || err.message || 'Registration failed';
      setErrors({ form: errMsg });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">SC</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Smart Campus App — East West University</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated space-y-4">
          {errors.form && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{errors.form}</div>}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Student ID</label>
            <input className={`input ${errors.studentId ? 'input-error' : ''}`} placeholder="2023-2-60-053" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
            {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input className="input" placeholder="Ahmed Muttakee" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">University Email</label>
            <input className={`input ${errors.email ? 'input-error' : ''}`} placeholder="name@ewubd.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Mobile Number</label>
            <input className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="01XXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Department</label>
              <input className="input" placeholder="CSE" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Semester</label>
              <input className="input" type="number" placeholder="1" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input className={`input ${errors.password ? 'input-error' : ''}`} type="password" placeholder="Min 8 chars, uppercase, digit, special" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
            <input className={`input ${errors.confirmPassword ? 'input-error' : ''}`} type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Register'}
          </button>
          <p className="text-center text-sm text-gray-500">Already have an account? <Link href="/auth/login" className="text-blue-600 font-medium">Login</Link></p>
        </form>
      </div>
    </div>
  );
}
