'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable, SearchBar, Pagination, LoadingSkeleton, Badge, Modal } from '@/components/UI';
import { useToast, useDebounce } from '@/components/hooks';
import api from '@/lib/api';
import libraryNav from '../nav';

export default function BooksPage() {
  const { user, logout } = useAuth();
  const { show, ToastComponent } = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ isbn: '', title: '', author: '', publisher: '', year: '', quantity: '1', locationCode: '', category: '' });
  const debouncedSearch = useDebounce(search, 300);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const r = await api.get('/library/books', { params: { page, limit: 25, search: debouncedSearch || undefined } });
      setBooks(r.data.data); setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, [debouncedSearch, page]);

  const addBook = async () => {
    try {
      await api.post('/library/books', { ...form, year: form.year ? parseInt(form.year) : undefined, quantity: parseInt(form.quantity) });
      show('Book added!', 'success'); setAddModal(false); fetchBooks();
      setForm({ isbn: '', title: '', author: '', publisher: '', year: '', quantity: '1', locationCode: '', category: '' });
    } catch (err: any) { show(err.response?.data?.error?.message || 'Failed', 'error'); }
  };

  const columns = [
    { key: 'isbn', label: 'ISBN', render: (v: any) => <span className="font-mono text-xs">{v}</span> },
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'availableQty', label: 'Available', render: (v: any, row: any) => <Badge text={`${v}/${row.quantity}`} variant={v > 0 ? 'success' : 'danger'} /> },
    { key: 'locationCode', label: 'Location', render: (v: any) => v || 'N/A' },
  ];

  return (
    <DashboardLayout navItems={libraryNav} activePath="/library/books" userName={user?.fullName || ''} role="Library Staff" onLogout={logout}>
      <ToastComponent />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book Catalogue</h1>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add Book</button>
      </div>

      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search by title, author, ISBN..." /></div>

      {loading ? <LoadingSkeleton lines={8} /> : (
        <>
          <DataTable columns={columns} data={books} emptyMessage="No books found" />
          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Book">
        <div className="space-y-3">
          <input className="input" placeholder="ISBN" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} />
          <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <input className="input" placeholder="Author" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Publisher" value={form.publisher} onChange={e => setForm({...form, publisher: e.target.value})} />
            <input className="input" type="number" placeholder="Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            <input className="input" placeholder="Location Code" value={form.locationCode} onChange={e => setForm({...form, locationCode: e.target.value})} />
          </div>
          <input className="input" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          <button className="btn btn-primary w-full" onClick={addBook}>Add Book</button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
