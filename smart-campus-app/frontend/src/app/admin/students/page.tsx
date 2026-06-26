'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, SearchBar, SelectFilter, Pagination, LoadingSkeleton, Badge, Modal, ConfirmModal } from '@/components/UI';
import { useToast, useDebounce } from '@/components/hooks';
import api from '@/lib/api';
import { formatDate, formatBDT } from '@/lib/utils';
import adminNav from '../nav';

export default function StudentsPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [suspendModal, setSuspendModal] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      const r = await api.get('/admin/students', { params });
      setStudents(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [debouncedSearch, status, page]);

  const handleSuspend = async (studentId: string) => {
    try {
      await api.post(`/admin/students/${studentId}/suspend`, { reason: 'Administrative action', duration: '7d' });
      show('Student suspended', 'success'); setSuspendModal(false); fetchStudents();
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const columns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'department', label: 'Department', render: (v: any) => v || 'N/A' },
    { key: 'status', label: 'Status', render: (v: any) => <Badge text={v} variant={v === 'ACTIVE' ? 'success' : v === 'SUSPENDED' ? 'danger' : 'warning'} /> },
    { key: 'kycStatus', label: 'KYC', render: (v: any) => <Badge text={v} variant={v === 'APPROVED' ? 'success' : 'warning'} /> },
    { key: 'createdAt', label: 'Joined', render: (v: any) => formatDate(v) },
  ];

  return (
    <DashboardLayout navItems={adminNav} activePath="/admin/students" userName={user?.fullName || ''} role="Admin" onLogout={logout}>
      <ToastComponent />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Management</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search by ID, name, email..." /></div>
        <SelectFilter label="" options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'PENDING', label: 'Pending' }]} value={status} onChange={setStatus} />
      </div>

      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={students} onRowClick={setSelectedStudent} />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Detail">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                {selectedStudent.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedStudent.fullName}</h3>
                <p className="text-gray-500">{selectedStudent.studentId} • {selectedStudent.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge text={selectedStudent.status} variant={selectedStudent.status === 'ACTIVE' ? 'success' : 'danger'} />
                  <Badge text={selectedStudent.kycStatus} variant="info" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Phone</span>{selectedStudent.phone}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block">Department</span>{selectedStudent.department || 'N/A'}</div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button className="btn btn-danger btn-sm" onClick={() => { setSuspendModal(true); }}>Suspend</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {suspendModal && <ConfirmModal open={suspendModal} onClose={() => setSuspendModal(false)} title="Suspend Student" message={`Suspend ${selectedStudent?.fullName}? They will lose access immediately.`} confirmText="Suspend" danger onConfirm={() => selectedStudent && handleSuspend(selectedStudent.id)} />}
    </DashboardLayout>
  );
}
