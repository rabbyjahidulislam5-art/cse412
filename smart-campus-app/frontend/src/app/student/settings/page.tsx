'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import studentNav from '../nav';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [passwords, setPasswords] = useState({ current: '', newP: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    if (passwords.newP !== passwords.confirm) return show('Passwords do not match', 'error');
    if (passwords.newP.length < 8) return show('Min 8 characters required', 'error');
    setChangingPw(true);
    try {
      await api.post('/student/change-password', { currentPassword: passwords.current, newPassword: passwords.newP });
      show('Password changed!', 'success');
      setPasswords({ current: '', newP: '', confirm: '' });
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
    finally { setChangingPw(false); }
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/settings" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">🔐 Change Password</h2>
          <div className="space-y-3">
            <input className="input" type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
            <input className="input" type="password" placeholder="New Password (min 8 chars)" value={passwords.newP} onChange={e => setPasswords({...passwords, newP: e.target.value})} />
            <input className="input" type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={changingPw || !passwords.current || !passwords.newP}>
              {changingPw ? 'Changing...' : 'Update Password'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">🛡️ Two-Factor Authentication</h2>
          <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account with TOTP-based 2FA.</p>
          <button className="btn btn-secondary btn-sm">Enable 2FA</button>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">🔔 Notification Preferences</h2>
          {['Push Notifications', 'Email Notifications', 'SMS Notifications'].map(pref => (
            <div key={pref} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{pref}</span>
              <div className="w-10 h-6 bg-blue-600 rounded-full cursor-pointer relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-semibold text-red-600 mb-4">Danger Zone</h2>
          <button className="btn btn-danger btn-sm" onClick={logout}>Logout</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
