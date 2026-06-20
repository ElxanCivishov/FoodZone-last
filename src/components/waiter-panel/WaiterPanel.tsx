import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Bell, Table, CheckCircle, UserCheck, Volume2, VolumeX } from 'lucide-react';
import { useWaiterStore } from '@/stores/waiterStore';
import { useSocketContext } from '@/services/socket';
import { WaiterOrder, WaiterRequestItem } from '@/types';

const requestTypeConfig: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  call: { icon: Bell, label: 'Call Waiter', color: 'text-blue-400 bg-blue-400/10' },
  water: { icon: Bell, label: 'Water', color: 'text-cyan-400 bg-cyan-400/10' },
  napkin: { icon: Bell, label: 'Napkin', color: 'text-purple-400 bg-purple-400/10' },
  bill: { icon: Bell, label: 'Bill', color: 'text-green-400 bg-green-400/10' },
  clean: { icon: Bell, label: 'Clean Table', color: 'text-orange-400 bg-orange-400/10' },
  other: { icon: Bell, label: 'Other', color: 'text-dark-400 bg-dark-700' },
};

export function WaiterPanel() {
  const { orders, pendingRequests, acceptedRequests, activeTab, setActiveTab, serveOrder, acceptRequest, completeRequest, addOrder, addRequest } = useWaiterStore();
  const { emitEvent, joinRoom, isConnected, socket } = useSocketContext();
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => { if (isConnected) joinRoom('waiters', 'waiter'); }, [isConnected, joinRoom]);

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (data: any) => {
      const order: WaiterOrder = {
        id: data.orderId, orderNumber: data.orderNumber || String(Math.floor(10000 + Math.random() * 90000)),
        tableId: data.tableId, tableNumber: data.tableNumber || '5', items: data.items || [],
        total: data.total || 0, paymentMethod: data.paymentMethod || 'cash', status: 'ready',
        createdAt: new Date().toISOString(), readyAt: new Date().toISOString(),
      };
      addOrder(order);
      if (soundEnabled) { const audio = new Audio('/notification.mp3'); audio.play().catch(() => {}); }
    };
    const handleNewRequest = (data: any) => {
      const request: WaiterRequestItem = {
        id: data.requestId, tableId: data.tableId, tableNumber: data.tableNumber || '5',
        type: data.type, status: 'pending', message: data.message, createdAt: data.createdAt || new Date().toISOString(),
      };
      addRequest(request);
      if (soundEnabled) { const audio = new Audio('/notification.mp3'); audio.play().catch(() => {}); }
    };
    socket.on('waiter:new:order', handleNewOrder);
    socket.on('waiter:new:request', handleNewRequest);
    return () => {
      socket.off('waiter:new:order', handleNewOrder);
      socket.off('waiter:new:request', handleNewRequest);
    };
  }, [socket, addOrder, addRequest, soundEnabled]);

  const tabs = [
    { id: 'orders' as const, label: 'Ready Orders', count: orders.length, icon: ClipboardList, color: 'text-green-400' },
    { id: 'requests' as const, label: 'Requests', count: pendingRequests.length + acceptedRequests.length, icon: Bell, color: 'text-yellow-400' },
    { id: 'tables' as const, label: 'Tables', count: 0, icon: Table, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center"><UserCheck size={24} className="text-primary-400" /></div>
            <div><h1 className="text-xl font-bold">Waiter Panel</h1><p className="text-dark-400 text-sm">FoodZone - Sahil Branch</p></div>
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
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && <OrdersTab orders={orders} onServe={(id: string) => serveOrder(id, emitEvent)} />}
          {activeTab === 'requests' && <RequestsTab pending={pendingRequests} accepted={acceptedRequests} onAccept={(id: string) => acceptRequest(id, emitEvent)} onComplete={(id: string) => completeRequest(id, emitEvent)} />}
          {activeTab === 'tables' && <TablesTab />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrdersTab({ orders, onServe }: { orders: WaiterOrder[]; onServe: (id: string) => void }) {
  if (orders.length === 0) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20"><CheckCircle size={48} className="text-dark-500 mx-auto mb-4" /><p className="text-dark-400 text-lg">No ready orders</p></motion.div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 font-bold">{order.tableNumber}</span>
                <div>
                  <p className="text-white font-medium">Order #{order.orderNumber}</p>
                  <p className="text-dark-400 text-xs">Table {order.tableNumber} • Ready {order.readyAt ? new Date(order.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
              </div>
              <span className="text-green-400 text-sm font-medium">Ready</span>
            </div>
            <div className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-white text-sm font-medium">{item.quantity}x</span>
                  <div>
                    <p className="text-white text-sm">{item.productName}</p>
                    {(item.selectedSize || item.selectedExtras.length > 0) && <p className="text-dark-400 text-xs">{item.selectedSize && `Size: ${item.selectedSize}`}{item.selectedExtras.length > 0 && ` • +${item.selectedExtras.join(', ')}`}</p>}
                  </div>
                </div>
              ))}
            </div>
            {order.specialRequest && <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4"><p className="text-yellow-400 text-sm">{order.specialRequest}</p></div>}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-lg">${order.total.toFixed(2)}</span>
              <span className="text-dark-400 text-sm capitalize">{order.paymentMethod}</span>
            </div>
            <button onClick={() => onServe(order.id)} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><CheckCircle size={18} /> Mark Served</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function RequestsTab({ pending, accepted, onAccept, onComplete }: { pending: WaiterRequestItem[]; accepted: WaiterRequestItem[]; onAccept: (id: string) => void; onComplete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Bell size={20} className="text-yellow-400" /> Pending ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-dark-500 text-center py-8">No pending requests</p> : (
          <div className="space-y-3">
            <AnimatePresence>
              {pending.map((request) => {
                const config = requestTypeConfig[request.type] || requestTypeConfig.other;
                const Icon = config.icon;
                return (
                  <motion.div key={request.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}><Icon size={20} /></div>
                        <div>
                          <p className="text-white font-medium">{config.label}</p>
                          <p className="text-dark-400 text-sm">Table {request.tableNumber}</p>
                          <p className="text-dark-500 text-xs mt-1">{new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          {request.message && <p className="text-dark-300 text-sm mt-2 bg-dark-700 rounded-lg p-2">{request.message}</p>}
                        </div>
                      </div>
                      <button onClick={() => onAccept(request.id)} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Accept</button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      {accepted.length > 0 && (
        <div>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><UserCheck size={20} className="text-blue-400" /> In Progress ({accepted.length})</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {accepted.map((request) => {
                const config = requestTypeConfig[request.type] || requestTypeConfig.other;
                const Icon = config.icon;
                return (
                  <motion.div key={request.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}><Icon size={20} /></div>
                        <div>
                          <p className="text-white font-medium">{config.label}</p>
                          <p className="text-dark-400 text-sm">Table {request.tableNumber}</p>
                          <span className="text-blue-400 text-xs mt-1 inline-block">Accepted</span>
                        </div>
                      </div>
                      <button onClick={() => onComplete(request.id)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Complete</button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function TablesTab() {
  const tables = Array.from({ length: 12 }, (_, i) => ({
    id: `table-${i + 1}`, number: String(i + 1),
    status: ['active', 'occupied', 'active', 'active', 'occupied', 'active', 'active', 'active', 'occupied', 'active', 'active', 'active'][i] as 'active' | 'occupied' | 'inactive',
  }));
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
      {tables.map((table) => (
        <div key={table.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border ${table.status === 'occupied' ? 'bg-red-500/10 border-red-500/30 text-red-400' : table.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-dark-800 border-dark-700 text-dark-500'}`}>
          <Table size={24} /><span className="font-bold text-lg">{table.number}</span><span className="text-xs capitalize">{table.status}</span>
        </div>
      ))}
    </div>
  );
}
