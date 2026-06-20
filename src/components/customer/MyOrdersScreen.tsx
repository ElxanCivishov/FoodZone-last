import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTableOrders } from '@/hooks/useOrders';
import { ORDER_STATUS_COLORS } from '@/utils/constants';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

export function MyOrdersScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const session = useSessionStore((state) => state.session);
  const { data: orders, isLoading } = useTableOrders(session?.tableId || '');

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('order.trackTitle')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !orders?.data?.length ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-foreground-muted mb-3" />
            <p className="text-foreground-muted">{t('order.noOrders')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.data.map((order: any) => (
              <div key={order.id} className="p-4 bg-surface-elevated border border-border rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">#{order.orderNumber}</span>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium text-white",
                      ORDER_STATUS_COLORS[order.status] || 'bg-gray-500'
                    )}
                  >
                    {t(`order.status.${order.status}`)}
                  </span>
                </div>
                <p className="text-sm text-foreground-muted mb-2">
                  {order.items?.length || 0} items · ${order.total?.toFixed(2) || '0.00'}
                </p>
                <div className="flex gap-2">
                  {order.items?.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-foreground-muted/5 flex items-center justify-center text-xs">
                      {item.quantity}x
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
