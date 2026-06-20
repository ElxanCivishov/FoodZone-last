import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSocketContext } from '@/services/socket';
import { ORDER_STATUS_FLOW } from '@/utils/constants';
import { ChevronLeft, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

export function OrderTrackingScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const { currentOrder, updateOrderStatus } = useOrderStore();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket || !currentOrder) return;
    const room = `table:${currentOrder.tableId}`;
    socket.emit('room:join', { room });

    const handleUpdate = (data: any) => {
      if (data.orderId === currentOrder.id) {
        updateOrderStatus({ orderId: data.orderId, status: data.status, timestamp: new Date().toISOString() });
      }
    };
    socket.on('customer:order:update', handleUpdate);
    socket.on('customer:order:ready', handleUpdate);
    return () => {
      socket.emit('room:leave', { room });
      socket.off('customer:order:update', handleUpdate);
      socket.off('customer:order:ready', handleUpdate);
    };
  }, [socket, currentOrder, updateOrderStatus]);

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <p className="text-foreground-muted">{t('order.noOrders')}</p>
        <button onClick={() => setScreen('home')} className="mt-4 text-primary-500">
          {t('home.menu')}
        </button>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentOrder.status as any);

  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('order.trackTitle')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <p className="text-sm text-foreground-muted">{t('order.number')}</p>
          <p className="text-2xl font-bold">#{currentOrder.orderNumber}</p>
          {currentOrder.estimatedTime && (
            <p className="text-sm text-primary-500 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              {t('order.estimated', { time: currentOrder.estimatedTime })}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-foreground-muted/10" />
          <div className="space-y-6">
            {ORDER_STATUS_FLOW.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={status} className="relative flex items-start gap-4 pl-1">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2",
                      isCompleted
                        ? "bg-primary-500 border-primary-500 text-white"
                        : "bg-surface border-foreground-muted/20 text-foreground-muted"
                    )}
                  >
                    {isCompleted && index < currentIndex && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                    {isCurrent && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className={cn("font-medium", isCompleted ? "text-foreground" : "text-foreground-muted")}>
                      {t(`order.status.${status}`)}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-primary-500 mt-0.5">
                        {t('order.estimated', { time: currentOrder.estimatedTime || 15 })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4 bg-surface-elevated border border-border rounded-2xl">
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground-muted">
                  {item.quantity}x {item.product?.name || 'Product'}
                </span>
                <span>${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold">
            <span>{t('cart.total')}</span>
            <span className="text-primary-500">${currentOrder.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
