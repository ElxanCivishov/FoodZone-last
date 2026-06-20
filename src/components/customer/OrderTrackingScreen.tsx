import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChefHat, Package, Truck, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSocketContext } from '@/services/socket';
import { ORDER_STATUS_FLOW } from '@/utils/constants';
import type { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-400' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', color: 'text-blue-400' },
  preparing: { icon: ChefHat, label: 'Preparing', color: 'text-orange-400' },
  ready: { icon: Package, label: 'Ready', color: 'text-green-400' },
  served: { icon: Truck, label: 'Served', color: 'text-primary-400' },
  cancelled: { icon: Clock, label: 'Cancelled', color: 'text-red-400' },
};

export function OrderTrackingScreen() {
  const setScreen = useUIStore((s) => s.setScreen);
  const { currentOrder, updateOrderStatus } = useOrderStore();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data: { orderId: string; status: OrderStatus; estimatedTime?: number }) => {
      if (currentOrder && data.orderId === currentOrder.id) {
        updateOrderStatus({ orderId: data.orderId, status: data.status, timestamp: new Date().toISOString(), estimatedTime: data.estimatedTime });
      }
    };
    socket.on('customer:order:update', handleStatusUpdate);
    socket.on('customer:order:ready', handleStatusUpdate);
    return () => {
      socket.off('customer:order:update', handleStatusUpdate);
      socket.off('customer:order:ready', handleStatusUpdate);
    };
  }, [socket, currentOrder, updateOrderStatus]);

  const currentStatus = currentOrder?.status || 'pending';
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  if (!currentOrder) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><p className="text-dark-400">No active order</p></div>;
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setScreen('home')} className="text-dark-400 hover:text-white"><ArrowLeft size={24} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">Order #{currentOrder.orderNumber}</h1>
          <p className="text-dark-400 text-sm">Table {currentOrder.table?.number}</p>
        </div>
      </div>
      <div className="px-4 py-6">
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-white font-semibold mb-6">Order Status</h2>
          <div className="space-y-0">
            {ORDER_STATUS_FLOW.map((status, index) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <motion.div animate={isCurrent ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary-500/20' : 'bg-dark-700'}`}>
                      <Icon size={20} className={isActive ? config.color : 'text-dark-500'} />
                    </motion.div>
                    {index < ORDER_STATUS_FLOW.length - 1 && <div className={`w-0.5 h-12 ${index < currentIndex ? 'bg-primary-500' : 'bg-dark-700'}`} />}
                  </div>
                  <div className="pb-8">
                    <p className={`font-medium ${isActive ? 'text-white' : 'text-dark-500'}`}>{config.label}</p>
                    {isCurrent && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-dark-400 text-sm mt-1">{status === 'preparing' && currentOrder.estimatedTime ? `Estimated time: ${currentOrder.estimatedTime} min` : 'In progress...'}</motion.p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-panel p-4">
          <h2 className="text-white font-semibold mb-4">Order Details</h2>
          <div className="space-y-3">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div><p className="text-white text-sm">{item.quantity}x Product</p><p className="text-dark-400 text-xs">${item.unitPrice.toFixed(2)} each</p></div>
                <span className="text-white font-medium">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-dark-700 pt-3 flex justify-between">
              <span className="text-dark-400">Total</span>
              <span className="text-white font-bold text-lg">${currentOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
