'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/utils';
import studentNav from '../nav';
import { Badge, LoadingSkeleton } from '@/components/UI';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', department: '', semester: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/profile').then(r => {
      setProfile(r.data.data);
      setForm({ fullName: r.data.data.fullName, department: r.data.data.department || '', semester: String(r.data.data.semester || '') });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/student/profile', { ...form, semester: form.semester ? parseInt(form.semester) : undefined });
      setProfile({ ...profile, ...form, semester: form.semester ? parseInt(form.semester) : undefined });
      setEditing(false);
      show('Profile updated!', 'success');
    } catch (err: any) { show(err.response?.data?.error?.message || 'Update failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout navItems={studentNav} activePath="/student/profile" userName="" role="Student" onLogout={logout}><LoadingSkeleton lines={6} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/profile" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button className={`btn ${editing ? 'btn-secondary' : 'btn-primary'} btn-sm`} onClick={() => editing ? setEditing(false) : setEditing(true)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {profile?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{profile?.fullName}</h2>
          <p className="text-gray-500 text-sm">{profile?.studentId}</p>
          <div className="flex justify-center gap-2 mt-2">
            <Badge text={profile?.kycStatus} variant={profile?.kycStatus === 'APPROVED' ? 'success' : 'warning'} />
            <Badge text={profile?.advisingStatus || 'N/A'} variant={profile?.advisingStatus === 'CLEAR' ? 'success' : 'danger'} />
          </div>
          <div className="mt-4 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-700">{profile?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-700">{profile?.phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-700">{profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
          {editing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label><input className="input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Department</label><input className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Semester</label><input className="input" type="number" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} /></div>
              <div className="flex items-end"><button className="btn btn-primary w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Student ID', value: profile?.studentId },
                { label: 'Department', value: profile?.department || 'Not set' },
                { label: 'Semester', value: profile?.semester || 'N/A' },
                { label: '2FA Status', value: profile?.totpEnabled ? 'Enabled ✅' : 'Disabled' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-semibold text-gray-900 mt-8 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Wallet Balance', value: profile?.wallet ? formatBDT(profile.wallet.balance) : 'N/A', color: 'text-blue-600' },
              { label: 'Wallet Status', value: profile?.wallet?.status || 'N/A', color: 'text-gray-600' },
              { label: 'Active Fines', value: String(profile?.activeFineCount || 0), color: 'text-red-600' },
              { label: 'Total Fines Due', value: formatBDT(profile?.totalFinesDue || 0), color: 'text-red-600' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-lg font-bold ${item.color} mt-0.5`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
