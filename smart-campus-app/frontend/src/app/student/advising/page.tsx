'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge, EmptyState, LoadingSkeleton } from '@/components/UI';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import studentNav from '../nav';

export default function AdvisingPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fines/advising/status').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const isCleared = data?.isCleared;

  return (
    <DashboardLayout navItems={studentNav} activePath="/student/advising" userName={user?.fullName || ''} role="Student" onLogout={logout}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Advising</h1>

      {loading ? <LoadingSkeleton lines={4} /> : (
        <>
          <div className={`status-card ${isCleared ? 'success' : 'danger'} mb-6`}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{isCleared ? '✅' : '🚫'}</span>
              <div>
                <h2 className="text-xl font-bold">{isCleared ? 'CLEAR — Advising Available' : 'HOLD — Advising Blocked'}</h2>
                {!isCleared && <p className="text-sm text-red-600 mt-1">{data?.clearance?.blockedReason || 'Outstanding obligations blocking advising'}</p>}
                {isCleared && <p className="text-sm text-green-600 mt-1">You can now book your advising appointment.</p>}
              </div>
            </div>
          </div>

          {!isCleared && data?.activeFines?.length > 0 && (
            <div className="card mb-6">
              <h2 className="font-semibold mb-4">Blockers</h2>
              <div className="space-y-3">
                {data.activeFines.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge text={f.type} variant="danger" />
                      <span className="text-sm">{f.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-red-600">৳{Number(f.accumulatedAmount) / 100}</span>
                      <a href="/student/fines" className="btn btn-primary btn-sm">Pay Now</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCleared && (
            <div className="card">
              <h2 className="font-semibold mb-4">Advising Information</h2>
              <p className="text-gray-600 text-sm mb-4">Contact your academic advisor to schedule an appointment. Your clearance status is available for the registrar.</p>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <span className="text-4xl block mb-2">🎓</span>
                <p className="font-semibold text-green-800">You are cleared for course registration</p>
                <p className="text-sm text-green-600 mt-1">Cleared at: {data?.clearance?.clearedAt ? formatDate(data.clearance.clearedAt) : 'N/A'}</p>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
