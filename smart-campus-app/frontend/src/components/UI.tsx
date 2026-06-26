'use client';
import { useState, useEffect, ReactNode } from 'react';

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = '540px' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button>
      </div>
    </Modal>
  );
}

export function SuccessModal({ open, onClose, title, message }: {
  open: boolean; onClose: () => void; title: string; message: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-gray-600">{message}</p>
        <button className="btn btn-primary mt-4" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

// ─── useToast ─────────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const ToastComponent = () => {
    if (!toast) return null;
    const bgMap = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
    return (
      <div className="toast">
        <div className={`${bgMap[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-64`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-70 hover:opacity-100">&times;</button>
        </div>
      </div>
    );
  };

  return { show, ToastComponent, toastEl: toast ? <ToastComponent /> : null };
}

// ─── Other UI Components ──────────────────────────────────────────────────────
export function KPICard({ title, value, icon, trend, trendUp, color = 'blue' }: {
  title: string; value: string; icon: string; trend?: string; trendUp?: boolean; color?: string;
}) {
  const bgMap: Record<string, string> = { blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', red: 'from-red-500 to-red-600', amber: 'from-amber-500 to-amber-600', purple: 'from-purple-500 to-purple-600' };
  return (
    <div className="card-elevated animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && <p className={`text-xs mt-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>{trendUp ? '↑' : '↓'} {trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgMap[color] || bgMap.blue} flex items-center justify-center text-white text-xl`}>{icon}</div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold mt-1">{value}</p>{sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}</div>;
}

export function DataTable({ columns, data, onRowClick, emptyMessage = 'No data found' }: {
  columns: { key: string; label: string; render?: (val: any, row: any) => ReactNode }[];
  data: any[];
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="table">
        <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {data.length === 0 ? <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">{emptyMessage}</td></tr> : data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
              {columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
      <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
      <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <input className="input pl-10" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3 mb-4">{children}</div>;
}

export function SelectFilter({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <select className="input text-sm" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <span className="text-6xl block mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action && <button className="btn btn-primary" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

export function LoadingSkeleton({ lines = 5 }: { lines?: number }) {
  return <div className="space-y-3">{Array.from({ length: lines }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" style={{ animationDelay: `${i * 0.1}s` }} />)}</div>;
}

export function Badge({ text, variant = 'info' }: { text: string; variant?: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'default' }) {
  const map: Record<string, string> = { success: 'badge-success', danger: 'badge-danger', warning: 'badge-warning', info: 'badge-info', purple: 'badge-purple', default: 'bg-gray-100 text-gray-600' };
  return <span className={`badge ${map[variant]}`}>{text}</span>;
}

export function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
      {tabs.map(t => (
        <button key={t.key} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${active === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => onChange(t.key)}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
