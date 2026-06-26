'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import adminNav from '../nav';

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [broadcast, setBroadcast] = useState({ target: 'ALL', targetValue: '', title: '', message: '', channels: ['PUSH'] });
  const [sending, setSending] = useState(false);

  const sendBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return show('Title and message required', 'error');
    setSending(true);
    try {
      await api.post('/admin/notifications/broadcast', broadcast);
      show('Broadcast sent!', 'success');
      setBroadcast({ target: 'ALL', targetValue: '', title: '', message: '', channels: ['PUSH'] });
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
    finally { setSending(false); }
  };

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/settings" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">📢 Send Broadcast Notification</h2>
          <div className="space-y-3">
            <select className="input" value={broadcast.target} onChange={e => setBroadcast({...broadcast, target: e.target.value})}>
              <option value="ALL">All Students</option><option value="DEPARTMENT">By Department</option><option value="INDIVIDUAL">Individual Student</option>
            </select>
            {broadcast.target !== 'ALL' && <input className="input" placeholder={broadcast.target === 'DEPARTMENT' ? 'Department name' : 'Student ID'} value={broadcast.targetValue} onChange={e => setBroadcast({...broadcast, targetValue: e.target.value})} />}
            <input className="input" placeholder="Notification Title" value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})} />
            <textarea className="input" rows={3} placeholder="Message content" value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})} />
            <button className="btn btn-primary w-full" onClick={sendBroadcast} disabled={sending}>{sending ? 'Sending...' : 'Send Broadcast'}</button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">⚙️ System Configuration</h2>
          <div className="space-y-3">
            {['Maintenance Mode', 'Allow New Registrations', 'Enable QR Payments', 'Enable Transfers'].map(s => (
              <div key={s} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm">{s}</span>
                <div className="w-10 h-6 bg-green-600 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
