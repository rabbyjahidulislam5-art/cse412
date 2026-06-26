'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import studentNav from '../nav';
import { Badge } from '@/components/UI';

export default function SupportPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ category: '', subject: '', description: '', priority: 'MEDIUM' });
  const [loading, setLoading] = useState(false);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.description) return;
    setLoading(true);
    try {
      await api.post('/student/support/ticket', form);
      show('Ticket submitted!', 'success');
      setForm({ category: '', subject: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const fetchTickets = async () => {
    try { const r = await api.get('/student/support/tickets'); setTickets(r.data.data); } catch {}
  };

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/support" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Support Center</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">New Ticket</h2>
          <form onSubmit={submitTicket} className="space-y-3">
            <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">Select Category</option>
              <option value="wallet">Wallet Issue</option><option value="payment">Payment Issue</option>
              <option value="fines">Fine Dispute</option><option value="advising">Advising Issue</option>
              <option value="technical">Technical Bug</option><option value="other">Other</option>
            </select>
            <input className="input" placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
            <textarea className="input" rows={4} placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
            <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
            </select>
            <button className="btn btn-primary w-full" disabled={loading} type="submit">{loading ? 'Submitting...' : 'Submit Ticket'}</button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">My Tickets</h2>
          {tickets.length === 0 ? <p className="text-gray-400 text-center py-8">No tickets yet</p> : (
            <div className="space-y-3">{tickets.map((t: any) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start"><span className="text-sm font-medium">{t.subject}</span><Badge text={t.status} variant={t.status === 'OPEN' ? 'warning' : t.status === 'RESOLVED' ? 'success' : 'info'} /></div>
                <p className="text-xs text-gray-400 mt-1">{t.category} • {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
