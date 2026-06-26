'use client';
export default function KYCPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6 animate-pulse"><span className="text-4xl">⏳</span></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h1>
        <p className="text-gray-500 mb-6">Your documents are being reviewed. You will receive a notification once approved. This usually takes 1-2 business days.</p>
        <div className="status-card warning text-left mb-4">
          <p className="text-sm text-amber-800"><strong>What happens next?</strong></p>
          <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
            <li>Admin reviews your submitted documents</li>
            <li>If approved, your account becomes active immediately</li>
            <li>If rejected, you can re-submit corrected documents</li>
          </ul>
        </div>
        <a href="/" className="btn btn-secondary">Back to Home</a>
      </div>
    </div>
  );
}
