'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import { SuccessModal, Badge } from '@/components/UI';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import libraryNav from '../nav';

export default function ReturnPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [isbn, setIsbn] = useState('');
  const [issue, setIssue] = useState<any>(null);
  const [condition, setCondition] = useState('GOOD');
  const [returning, setReturning] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [result, setResult] = useState<any>(null);

  const findIssue = async () => {
    if (!isbn) return;
    try {
      const r = await api.get('/library/overdue', { params: { search: isbn } });
      setIssue(r.data.data?.[0] || null);
      if (!r.data.data?.[0]) show('No active issue for this ISBN', 'error');
    } catch { show('Lookup failed', 'error'); }
  };

  const handleReturn = async () => {
    if (!issue) return;
    setReturning(true);
    try {
      const r = await api.post('/library/return', { bookIssueId: issue.id, condition });
      setResult(r.data.data);
      setSuccessModal(true);
      setIssue(null); setIsbn('');
    } catch (err: any) { show(err.response?.data?.error?.message || 'Return failed', 'error'); }
    finally { setReturning(false); }
  };

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/return" userName={user?.fullName || ''} role="Library Staff" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Return Book</h1>

      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Scan or Enter ISBN</h2>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Book ISBN or barcode" value={isbn} onChange={e => setIsbn(e.target.value)} onKeyDown={e => e.key === 'Enter' && findIssue()} />
            <button className="btn btn-primary" onClick={findIssue}>Find</button>
          </div>
        </div>

        {issue && (
          <div className="card">
            <h2 className="font-semibold mb-3">Issue Details</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Book:</span> {issue.book?.title}</p>
              <p><span className="text-gray-500">Student:</span> {issue.student?.fullName} ({issue.student?.studentId})</p>
              <p><span className="text-gray-500">Issued:</span> {new Date(issue.issuedAt).toLocaleDateString()}</p>
              <p><span className="text-gray-500">Due:</span> {new Date(issue.dueDate).toLocaleDateString()}</p>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Book Condition</label>
              <select className="input" value={condition} onChange={e => setCondition(e.target.value)}>
                <option value="GOOD">Good</option><option value="MINOR_DAMAGE">Minor Damage</option><option value="MAJOR_DAMAGE">Major Damage</option><option value="LOST">Lost</option>
              </select>
            </div>
            <button className="btn btn-success btn-lg w-full mt-4" onClick={handleReturn} disabled={returning}>{returning ? 'Processing...' : 'Confirm Return'}</button>
          </div>
        )}
      </div>

      <SuccessModal open={successModal} onClose={() => setSuccessModal(false)} title="Book Returned!" message={result?.fineAmount > 0 ? `Book returned. Fine of ${formatBDT(result.fineAmount)} posted to student account.` : 'Book returned. No fine incurred.'} />
    </DashboardLayout>
  );
}
