import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, CheckCircle, Clock, ChefHat, Volume2, VolumeX } from 'lucide-react';
import { useKitchenStore } from '@/stores/kitchenStore';
import { useSocketContext } from '@/services/socket';
import { KitchenOrder } from '@/types';

const priorityConfig = {
  normal: { color: 'bg-dark-700 text-dark-400', label: 'Normal' },
  high: { color: 'bg-orange-500/15 text-orange-400', label: 'High' },
  urgent: { color: 'bg-red-500/15 text-red-400', label: 'Urgent' },
};

export function KitchenPanel() {
  const { newOrders, preparingOrders, readyOrders, activeTab, setActiveTab, acceptOrder, markItemReady, markOrderReady, serveOrder, addOrder } = useKitchenStore();
  const { emitEvent, joinRoom, isConnected, socket } = useSocketContext();
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => { if (isConnected) joinRoom('kitchen', 'kitchen'); }, [isConnected, joinRoom]);

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (orderData: any) => {
      const order: KitchenOrder = {
        id: orderData.orderId,
        orderNumber: orderData.orderNumber || String(Math.floor(10000 + Math.random() * 90000)),
        tableId: orderData.tableId, tableNumber: orderData.tableNumber || '5',
        items: (orderData.items || []).map((item: any, idx: number) => ({
          id: item.id || `item-${idx}`, productId: item.productId, productName: item.productName || 'Unknown',
          quantity: item.quantity, selectedSize: item.selectedSize, selectedExtras: item.selectedExtras || [],
          specialNote: item.specialNote, status: 'pending' as const,
        })),
        status: 'confirmed', priority: 'normal', specialRequest: orderData.specialRequest,
        estimatedTime: 20, createdAt: new Date().toISOString(),
      };
      addOrder(order);
      if (soundEnabled) { const audio = new Audio('/notification.mp3'); audio.play().catch(() => {}); }
    };
    socket.on('kitchen:new:order', handleNewOrder);
    return () => { socket.off('kitchen:new:order', handleNewOrder); };
  }, [socket, addOrder, soundEnabled]);

  const tabs = [
    { id: 'new' as const, label: 'New Orders', count: newOrders.length, icon: Bell, color: 'text-yellow-400' },
    { id: 'preparing' as const, label: 'Preparing', count: preparingOrders.length, icon: Flame, color: 'text-orange-400' },
    { id: 'ready' as const, label: 'Ready', count: readyOrders.length, icon: CheckCircle, color: 'text-green-400' },
  ];

  const currentOrders = activeTab === 'new' ? newOrders : activeTab === 'preparing' ? preparingOrders : readyOrders;

  const getElapsedTime = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60);
    return diff < 1 ? 'Just now' : `${diff} min`;
  };

  const getRemainingTime = (order: KitchenOrder) => {
    if (!order.startedAt) return order.estimatedTime;
    const elapsed = Math.floor((Date.now() - new Date(order.startedAt).getTime()) / 1000 / 60);
    return Math.max(0, order.estimatedTime - elapsed);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center"><ChefHat size={24} className="text-primary-400" /></div>
            <div><h1 className="text-xl font-bold">Kitchen Panel</h1><p className="text-dark-400 text-sm">FoodZone - Sahil Branch</p></div>
          </div>
          <div className="flex items-center gap-3">
            {!isConnected && <span className="text-red-400 text-sm flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Reconnecting...</span>}
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-dark-400 hover:text-white">
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <span className="flex items-center gap-2 text-green-400 text-sm"><span className="w-2 h-2 bg-green-500 rounded-full" /> Online</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-2xl border transition-all text-left ${activeTab === tab.id ? 'bg-dark-800 border-primary-500/50' : 'bg-dark-800/50 border-dark-700'}`}>
                <div className="flex items-center justify-between mb-2"><Icon size={20} className={tab.color} /><span className={`text-2xl font-bold ${tab.color}`}>{tab.count}</span></div>
                <p className="text-dark-400 text-sm">{tab.label}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-4 pb-8">
        {currentOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-dark-500" /></div>
            <p className="text-dark-400 text-lg">No {activeTab} orders</p>
            <p className="text-dark-500 text-sm mt-1">New orders will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {currentOrders.map((order) => (
                <OrderCard key={order.id} order={order} activeTab={activeTab}
                  onAccept={() => acceptOrder(order.id, emitEvent)}
                  onItemReady={(itemId) => markItemReady(order.id, itemId, emitEvent)}
                  onOrderReady={() => markOrderReady(order.id, emitEvent)}
                  onServe={() => serveOrder(order.id, emitEvent)}
                  elapsedTime={getElapsedTime(order.createdAt)}
                  remainingTime={getRemainingTime(order)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, activeTab, onAccept, onItemReady, onOrderReady, onServe, elapsedTime, remainingTime }: any) {
  const priority = priorityConfig[order.priority];
  const allItemsReady = order.items.every((item: any) => item.status === 'ready');
  const readyCount = order.items.filter((item: any) => item.status === 'ready').length;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-400 font-bold">{order.tableNumber}</span>
            <div>
              <p className="text-white font-medium">Order #{order.orderNumber}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${priority.color}`}>{priority.label}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-dark-400 text-sm flex items-center gap-1"><Clock size={14} />{elapsedTime}</p>
            {activeTab === 'preparing' && <p className="text-orange-400 text-sm font-medium">{remainingTime} min left</p>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">${order.items.reduce((sum: number, i: any) => sum + (i.quantity * 10), 0).toFixed(2)}</span>
          <span className="text-dark-400 text-sm">{order.items.length} items</span>
        </div>
        {activeTab === 'preparing' && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-dark-400 mb-1"><span>Progress</span><span>{readyCount}/{order.items.length} ready</span></div>
            <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(readyCount / order.items.length) * 100}%` }} /></div>
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        {order.items.map((item: any) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{item.quantity}x</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{item.productName}</p>
              {(item.selectedSize || item.selectedExtras.length > 0 || item.specialNote) && (
                <p className="text-dark-400 text-xs mt-0.5">
                  {item.selectedSize && `Size: ${item.selectedSize}`}
                  {item.selectedExtras.length > 0 && ` • +${item.selectedExtras.join(', ')}`}
                  {item.specialNote && ` • Note: ${item.specialNote}`}
                </p>
              )}
            </div>
            {activeTab === 'preparing' && (
              <button onClick={() => onItemReady(item.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.status === 'ready' ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-400 hover:bg-primary-500/20 hover:text-primary-400'}`}>
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        ))}
        {order.specialRequest && <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mt-2"><p className="text-yellow-400 text-sm">⚠️ {order.specialRequest}</p></div>}
      </div>
      <div className="p-4 border-t border-dark-700">
        {activeTab === 'new' && <button onClick={onAccept} className="w-full btn-primary py-3 flex items-center justify-center gap-2"><Flame size={18} /> Start Preparing</button>}
        {activeTab === 'preparing' && <button onClick={onOrderReady} disabled={!allItemsReady} className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle size={18} /> Mark Ready</button>}
        {activeTab === 'ready' && <button onClick={onServe} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><CheckCircle size={18} /> Mark Served</button>}
      </div>
    </motion.div>
  );
}
