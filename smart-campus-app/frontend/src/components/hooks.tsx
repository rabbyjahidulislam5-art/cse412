'use client';
import { useState, useEffect, type ReactNode } from 'react';

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

export function usePolling(fetchFn: () => Promise<void>, intervalMs = 5000, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    fetchFn();
    const id = setInterval(fetchFn, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}

export function useCountUp(target: number, duration = 400) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return current;
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
