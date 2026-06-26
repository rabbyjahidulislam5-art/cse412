'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function KYCUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    const newFiles = fileList.map(f => ({ id: URL.createObjectURL(f), name: f.name }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleSubmit = async () => {
    if (files.length < 2) return setError('Please upload both documents');
    setLoading(true); setError('');
    try {
      // In production: upload to S3, then submit file URLs
      await api.post('/auth/kyc/upload', {
        docType: 'NATIONAL_ID', fileUrl: files[0]?.name,
        secondDocType: 'ADMISSION_LETTER', secondFileUrl: files[1]?.name,
      });
      router.push('/auth/kyc-pending');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">📄</span></div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Upload your documents for verification</p>
        </div>

        <div className="card-elevated space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <span className="text-4xl block mb-2">📤</span>
            <p className="text-sm text-gray-600 mb-1">National ID or Birth Certificate (Front)</p>
            <p className="text-xs text-gray-400 mb-3">JPG, PNG, or PDF — Max 2 MB</p>
            <label className="btn btn-primary btn-sm cursor-pointer">
              Choose File<input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUpload} />
            </label>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <span className="text-4xl block mb-2">📋</span>
            <p className="text-sm text-gray-600 mb-1">Admission Letter or Student Card</p>
            <p className="text-xs text-gray-400 mb-3">JPG, PNG, or PDF — Max 2 MB</p>
            <label className="btn btn-primary btn-sm cursor-pointer">
              Choose File<input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUpload} />
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 px-3">
                  <span className="text-sm text-gray-600 truncate">📎 {f.name}</span>
                  <button onClick={() => removeFile(f.id)} className="text-red-500 text-sm hover:text-red-700">&times;</button>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary w-full btn-lg" onClick={handleSubmit} disabled={loading || files.length < 2}>
            {loading ? 'Uploading...' : 'Submit Documents'}
          </button>
        </div>
      </div>
    </div>
  );
}
