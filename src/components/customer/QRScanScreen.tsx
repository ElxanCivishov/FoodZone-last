import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { QrCode, Keyboard, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function QRScanScreen() {
  const { t } = useTranslation();
  const validateQR = useSessionStore((state) => state.validateQR);
  const setScreen = useUIStore((state) => state.setScreen);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    let scanner: any = null;
    if (isScanning && !showManual) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        scanner = new Html5Qrcode('qr-reader');
        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText: string) => {
              await handleQR(decodedText);
            },
            () => {}
          )
          .catch(() => {
            setError('Camera access denied');
            setIsScanning(false);
          });
      });
    }
    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [isScanning, showManual]);

  const handleQR = async (data: string) => {
    setError('');
    try {
      const result = await validateQR(data);
      if (result.valid) {
        setScreen('language');
      }
    } catch (err: any) {
      setError(err.message || t('qr.invalid'));
    }
  };

  const handleManual = () => {
    if (!manualInput.trim()) return;
    handleQR(JSON.stringify({ tableId: manualInput.trim() }));
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <QrCode className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold">{t('qr.title')}</h1>
          <p className="text-foreground-muted">{t('qr.subtitle')}</p>
        </div>

        {showManual ? (
          <div className="space-y-3 animate-fade-in">
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={t('qr.manual')}
              className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl focus:outline-none focus:border-primary-500"
              autoFocus
            />
            <button
              onClick={handleManual}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              {t('common.confirm')}
            </button>
            <button
              onClick={() => setShowManual(false)}
              className="w-full py-2 text-sm text-foreground-muted hover:text-foreground"
            >
              {t('common.back')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              id="qr-reader"
              className={cn(
                "w-full aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-border",
                isScanning ? "border-primary-500" : ""
              )}
            >
              {!isScanning && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <QrCode className="w-12 h-12 text-foreground-muted mx-auto" />
                    <p className="text-sm text-foreground-muted">{t('qr.scanning')}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsScanning(!isScanning)}
              className={cn(
                "w-full py-3 rounded-xl font-medium transition-colors",
                isScanning
                  ? "bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              )}
            >
              {isScanning ? t('common.close') : t('qr.title')}
            </button>

            <button
              onClick={() => setShowManual(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl hover:border-primary-500 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-sm">{t('qr.manual')}</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-danger-500/10 text-danger-500 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
