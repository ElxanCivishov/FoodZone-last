import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/utils/constants';

export function MyOrdersScreen() {
  const { session } = useSessionStore();
  const { setScreen } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', session?.tableId],
    queryFn: () => get(`/orders/table/${session?.tableId}`),
    enabled: !!session?.tableId,
  });

  const orders = data?.data || [];

  return (
    <div className="min-h-screen bg-dark-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {isLoading ? (
        <p className="text-dark-400">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-dark-400 mb-4">No orders yet</p>
          <button onClick={() => setScreen('home')} className="bg-primary-500 px-6 py-2 rounded-xl">
            Order Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">#{order.orderNumber}</span>
                <span className={`text-xs px-2 py-1 rounded-full text-white ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-sm text-dark-400 mb-2">{new Date(order.createdAt).toLocaleString()}</p>
              <div className="space-y-1 text-sm">
                {order.items.map((item: any) => (
                  <p key={item.id}>{item.quantity}x {item.product?.name}</p>
                ))}
              </div>
              <p className="font-bold text-primary-400 mt-2">${order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
