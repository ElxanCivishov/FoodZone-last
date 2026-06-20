import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { Loader2 } from 'lucide-react';

export function QRScanScreen() {
  const { validateQR, isLoading, error } = useSessionStore();
  const { setScreen } = useUIStore();
  const [qrData, setQrData] = useState('');

  const handleScan = async () => {
    if (!qrData.trim()) return;
    try {
      const result = await validateQR(qrData);
      if (result.valid) {
        setScreen('language');
      }
    } catch {}
  };

  const handleDemo = () => {
    validateQR(JSON.stringify({
      restaurantId: 'demo',
      branchId: 'demo-branch',
      tableId: 'demo-table',
      tableNumber: '1',
      language: 'az',
    }));
    setScreen('language');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-4xl">📷</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">Scan QR Code</h1>
      <p className="text-dark-400 text-center mb-8">Point your camera at the QR code on your table</p>

      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={qrData}
          onChange={(e) => setQrData(e.target.value)}
          placeholder="Paste QR data here..."
          className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={handleScan}
          disabled={isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Scan'}
        </button>
        <button
          onClick={handleDemo}
          className="w-full bg-dark-800 hover:bg-dark-700 py-3 rounded-xl font-medium text-dark-400"
        >
          Demo Mode
        </button>
      </div>

      {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
    </div>
  );
}
