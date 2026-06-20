import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Camera, AlertCircle } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScanScreen() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const validateQR = useSessionStore((s) => s.validateQR);
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); };
  }, []);

  const startScanning = async () => {
    setScanning(true);
    setError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          handleQRResult(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const handleQRResult = async (qrData: string) => {
    try {
      const result = await validateQR(qrData);
      if (result.valid) setScreen('language');
      else setError(result.message || 'Invalid QR code');
    } catch (err) { setError('Failed to validate QR code'); }
  };

  const handleDemo = () => {
    handleQRResult(JSON.stringify({
      restaurantId: 'demo-restaurant', branchId: 'demo-branch',
      tableId: 'demo-table-1', tableNumber: '5', timestamp: Date.now(),
    }));
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm w-full">
        <div className="w-24 h-24 bg-primary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <QrCode size={48} className="text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">FoodZone</h1>
        <p className="text-dark-400 mb-8">Scan QR code to start ordering</p>
        {scanning ? (
          <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
            <div id="qr-reader" className="w-full h-full" />
            <div className="absolute inset-0 border-2 border-primary-500/50 rounded-2xl pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500" />
            </div>
            <button onClick={() => { scannerRef.current?.stop(); setScanning(false); }} className="absolute bottom-4 left-1/2 -translate-x-1/2 btn-secondary text-sm">Cancel</button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={startScanning} className="w-full btn-primary flex items-center justify-center gap-3">
              <Camera size={20} /> Scan QR Code
            </button>
            <button onClick={handleDemo} className="w-full btn-secondary text-sm">Demo Mode</button>
          </div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
