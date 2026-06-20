import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/sessionStore';
import { Order } from '@/types';

export function MyOrdersScreen() {
  const session = useSessionStore((s) => s.session);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.tableId) return;
    fetch(`/api/orders/table/${session.tableId}`)
      .then((res) => res.json())
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session?.tableId]);

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10', confirmed: 'text-blue-400 bg-blue-400/10',
    preparing: 'text-orange-400 bg-orange-400/10', ready: 'text-green-400 bg-green-400/10',
    served: 'text-primary-400 bg-primary-400/10', cancelled: 'text-red-400 bg-red-400/10',
  };

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4">
        <h1 className="text-xl font-bold text-white">My Orders</h1>
      </div>
      <div className="px-4 py-4">
        {orders.length === 0 ? <div className="text-center py-12"><p className="text-dark-400">No orders yet</p></div> : (
          <div className="space-y-3">
            {orders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">Order #{order.orderNumber}</p>
                    <p className="text-dark-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'text-dark-400 bg-dark-700'}`}>{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-dark-400 text-sm">{order.items.length} items</p>
                  <p className="text-white font-bold">${order.total.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
