import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useOrderStore } from '@/stores/orderStore';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

export function OrderSuccessScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const currentOrder = useOrderStore((state) => state.currentOrder);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-24 h-24 bg-success-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-success-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{t('order.success')}</h1>
          <p className="text-foreground-muted">
            {t('order.number')}: <span className="font-bold text-foreground">#{currentOrder?.orderNumber || 'N/A'}</span>
          </p>
        </div>

        <div className="p-4 bg-surface-elevated border border-border rounded-2xl">
          <p className="text-sm text-foreground-muted mb-1">{t('order.status.preparing')}</p>
          <div className="w-full bg-foreground-muted/10 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-500 h-full rounded-full animate-pulse w-1/3" />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setScreen('order-tracking')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            {t('order.tracking')}
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setScreen('home')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl hover:border-primary-500 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('home.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
