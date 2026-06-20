import { useEffect } from 'react';
import { useOrderStore } from '@/stores/orderStore';
import { useUIStore } from '@/stores/uiStore';
import { useSocketContext } from '@/services/socket';
import { ORDER_STATUS_FLOW } from '@/utils/constants';

export function OrderTrackingScreen() {
  const { currentOrder, updateOrderStatus } = useOrderStore();
  const { setScreen } = useUIStore();
  const { socket } = useSocketContext();

  useEffect(() => {
    socket?.on('customer:order:update', (update) => {
      updateOrderStatus({ orderId: update.orderId, status: update.status, timestamp: new Date().toISOString() });
    });
    return () => { socket?.off('customer:order:update'); };
  }, [socket, updateOrderStatus]);

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
        <p className="text-dark-400">No active order</p>
        <button onClick={() => setScreen('home')} className="mt-4 bg-primary-500 px-6 py-2 rounded-xl">
          Order Now
        </button>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_FLOW.indexOf(currentOrder.status as any);

  return (
    <div className="min-h-screen bg-dark-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Order Tracking</h1>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-dark-400 text-sm">Order #{currentOrder.orderNumber}</p>
            <p className="text-xl font-bold capitalize">{currentOrder.status}</p>
          </div>
          <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🍳</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-700" />
          {ORDER_STATUS_FLOW.map((status, i) => (
            <div key={status} className="relative flex items-center gap-4 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                i <= currentStep ? 'bg-primary-500' : 'bg-dark-700'
              }`}>
                {i < currentStep ? '✓' : i === currentStep ? '●' : '○'}
              </div>
              <span className={i <= currentStep ? 'text-white' : 'text-dark-400'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setScreen('home')} className="w-full bg-dark-800 hover:bg-dark-700 py-3 rounded-xl font-medium">
        Back to Menu
      </button>
    </div>
  );
}
