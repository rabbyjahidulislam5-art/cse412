'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/hooks';
import { Modal, SuccessModal } from '@/components/UI';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import libraryNav from '../nav';

export default function IssuePage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [bookQuery, setBookQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [dueDate, setDueDate] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const searchStudent = async () => {
    if (!studentId) return;
    try {
      const r = await api.get('/library/students', { params: { q: studentId } });
      setStudent(r.data.data?.[0] || null);
      if (!r.data.data?.[0]) show('Student not found', 'error');
    } catch { show('Search failed', 'error'); }
  };

  const searchBooks = async () => {
    if (!bookQuery) return;
    try {
      const r = await api.get('/library/books', { params: { search: bookQuery, limit: 5 } });
      setBooks(r.data.data || []);
    } catch {}
  };

  const handleIssue = async () => {
    setIssuing(true);
    try {
      await api.post('/library/issue', { studentId: student.studentId, bookId: selectedBook.id, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined });
      setSuccessModal(true); setConfirmModal(false);
      setStudent(null); setSelectedBook(null); setStudentId(''); setBookQuery(''); setDueDate('');
    } catch (err: any) { show(err.response?.data?.error?.message || 'Issue failed', 'error'); }
    finally { setIssuing(false); }
  };

  const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/issue" userName={user?.fullName || ''} role="Library Staff" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Issue Book</h1>

      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Step 1 — Student Lookup</h2>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Enter Student ID (e.g. 2023-2-60-001)" value={studentId} onChange={e => setStudentId(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchStudent()} />
            <button className="btn btn-primary" onClick={searchStudent}>Search</button>
          </div>
          {student && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{student.fullName?.charAt(0)}</div>
                <div><p className="font-semibold">{student.fullName}</p><p className="text-sm text-gray-500">{student.studentId} • {student.department}</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Step 2 — Book Lookup</h2>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" placeholder="ISBN or title" value={bookQuery} onChange={e => setBookQuery(e.target.value)} />
            <button className="btn btn-primary" onClick={searchBooks}>Search</button>
          </div>
          {books.length > 0 && (
            <div className="space-y-2">
              {books.filter(b => b.availableQty > 0).map(b => (
                <div key={b.id} onClick={() => setSelectedBook(b)} className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedBook?.id === b.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex justify-between"><span className="font-medium">{b.title}</span><span className="text-xs text-gray-500">{b.availableQty} available</span></div>
                  <p className="text-sm text-gray-500">{b.author} • {b.isbn}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Step 3 — Due Date</h2>
          <input type="date" className="input" min={new Date().toISOString().split('T')[0]} value={dueDate || defaultDue} onChange={e => setDueDate(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-lg w-full" disabled={!student || !selectedBook} onClick={() => setConfirmModal(true)}>Confirm Issue</button>
      </div>

      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Issue">
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p><span className="text-gray-500">Student:</span> {student?.fullName} ({student?.studentId})</p>
            <p><span className="text-gray-500">Book:</span> {selectedBook?.title}</p>
            <p><span className="text-gray-500">Due Date:</span> {formatDate(dueDate || defaultDue)}</p>
          </div>
          <button className="btn btn-primary w-full btn-lg" onClick={handleIssue} disabled={issuing}>{issuing ? 'Issuing...' : 'Issue Book'}</button>
        </div>
      </Modal>

      <SuccessModal open={successModal} onClose={() => setSuccessModal(false)} title="Book Issued!" message="Book has been issued successfully. Student will be notified." />
    </DashboardLayout>
  );
}
