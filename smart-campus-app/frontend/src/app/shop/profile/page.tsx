'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { LoadingSkeleton, Badge } from '@/components/UI';
import { useToast } from '@/components/hooks';
import api from '@/lib/api';
import { formatBDT, formatDate, getInitials } from '@/lib/utils';
import shopNav from '../nav';

export default function ShopProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    category: '',
    contactPhone: '',
    location: '',
  });

  const fetchProfile = async () => {
    try {
      const r = await api.get('/shop/profile');
      setProfile(r.data.data);
      setForm({
        shopName: r.data.data.shopName || '',
        category: r.data.data.category || '',
        contactPhone: r.data.data.contactPhone || '',
        location: r.data.data.location || '',
      });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/shop/profile', form);
      setProfile(r.data.data);
      setEditing(false);
      toast.show('Profile updated successfully', 'success');
    } catch (e: any) {
      toast.show(e.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout navItems={shopNav} activePath="/shop/profile" userName="" role="Shop Owner" onLogout={logout}><LoadingSkeleton lines={6} /></DashboardLayout>;

  return (
    <DashboardLayout navItems={shopNav} activePath="/shop/profile" userName={user?.fullName || ''} role="Shop Owner" onLogout={logout}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Merchant Profile</h1>
        {!editing ? (
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        ) : (
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4">
            {getInitials(profile?.shopName || user?.fullName || 'MS')}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{profile?.shopName || 'My Shop'}</h2>
          <p className="text-sm text-gray-500">{profile?.category || 'Uncategorized'}</p>
          <div className="mt-3 flex justify-center">
            <Badge
              text={profile?.status || 'PENDING'}
              variant={profile?.status === 'ACTIVE' ? 'success' : profile?.status === 'SUSPENDED' ? 'danger' : 'warning'}
            />
          </div>
          {profile?.merchantCode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400">Merchant Code</p>
              <p className="font-mono font-bold text-gray-700">{profile.merchantCode}</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Joined</span><span className="text-gray-700">{formatDate(profile?.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Lifetime Revenue</span><span className="font-semibold text-green-600">{formatBDT(profile?.lifetimeRevenue || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Total Transactions</span><span className="text-gray-700">{profile?.totalTransactions || 0}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Business Information</h2>
          {!editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Shop Name" value={profile?.shopName} />
              <Field label="Category" value={profile?.category} />
              <Field label="Contact Phone" value={profile?.contactPhone} />
              <Field label="Location" value={profile?.location} />
              <Field label="Owner Name" value={user?.fullName} />
              <Field label="Owner Email" value={user?.email} />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Shop Name" value={form.shopName} onChange={(v) => setForm({ ...form, shopName: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="CAFETERIA">Cafeteria</option>
                  <option value="STATIONERY">Stationery</option>
                  <option value="PHOTOCOPY">Photocopy / Print</option>
                  <option value="GROCERY">Grocery</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <InputField label="Contact Phone" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
              <InputField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-gray-800 font-medium">{value || '—'}</p>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
