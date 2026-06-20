import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useBranch } from '@/hooks/useMenu';
import { useSessionStore } from '@/stores/sessionStore';
import { ChevronLeft, Wifi, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export function WifiConnectScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const session = useSessionStore((state) => state.session);
  const { data: branch } = useBranch(session?.branchId || '');
  const [copied, setCopied] = useState(false);

  const wifiName = branch?.data?.wifiName || 'FoodZone-Guest';
  const wifiPassword = branch?.data?.wifiPassword || 'welcome2024';

  const copyPassword = () => {
    navigator.clipboard.writeText(wifiPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('wifi.title')}</h1>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mb-6">
          <Wifi className="w-10 h-10 text-primary-500" />
        </div>

        <div className="w-full space-y-4">
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl">
            <p className="text-sm text-foreground-muted mb-1">Network</p>
            <p className="text-lg font-semibold">{wifiName}</p>
          </div>

          <div className="p-4 bg-surface-elevated border border-border rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted mb-1">{t('wifi.password')}</p>
              <p className="text-lg font-semibold font-mono">{wifiPassword}</p>
            </div>
            <button
              onClick={copyPassword}
              className={cn(
                'p-3 rounded-xl transition-colors',
                copied ? 'bg-success-500/10 text-success-500' : 'bg-foreground-muted/5 hover:bg-foreground-muted/10'
              )}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
