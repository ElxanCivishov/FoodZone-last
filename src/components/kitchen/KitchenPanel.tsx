import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { useSocketContext } from '@/services/socket';
import { useKitchenStore } from '@/stores/kitchenStore';

export function KitchenPanel() {
  const { socket, joinRoom, isConnected } = useSocketContext();
  const { data: initialOrders } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: () => get('/orders', { status: 'pending,preparing,ready' }),
  });

  const { newOrders, preparingOrders, readyOrders, activeTab, setActiveTab, addOrder, acceptOrder, markOrderReady, serveOrder } = useKitchenStore();

  useEffect(() => {
    joinRoom('kitchen', 'kitchen');

    socket?.on('kitchen:new:order', (order) => {
      addOrder(order);
    });

    return () => {
      socket?.off('kitchen:new:order');
    };
  }, [socket, joinRoom, addOrder]);

  useEffect(() => {
    if (initialOrders?.data) {
      initialOrders.data.forEach((order: any) => {
        if (order.status === 'pending') addOrder(order);
      });
    }
  }, [initialOrders, addOrder]);

  const tabs = [
    { id: 'new', label: 'New', count: newOrders.length },
    { id: 'preparing', label: 'Preparing', count: preparingOrders.length },
    { id: 'ready', label: 'Ready', count: readyOrders.length },
  ];

  const currentOrders = activeTab === 'new' ? newOrders : activeTab === 'preparing' ? preparingOrders : readyOrders;

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Kitchen Panel</h1>
            <p className="text-dark-400">FoodZone - Sahil Branch</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Online' : 'Reconnecting...'}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentOrders.length === 0 ? (
            <div className="col-span-full text-center py-20 text-dark-400">
              <p className="text-lg">No {activeTab} orders</p>
              <p className="text-sm">New orders will appear here automatically</p>
            </div>
          ) : (
            currentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                activeTab={activeTab}
                onAccept={() => acceptOrder(order.id, (event, data) => socket?.emit(event, data))}
                onReady={() => markOrderReady(order.id, (event, data) => socket?.emit(event, data))}
                onServe={() => serveOrder(order.id, (event, data) => socket?.emit(event, data))}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, activeTab, onAccept, onReady, onServe }: any) {
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-primary-400 font-bold">Table {order.tableNumber}</span>
          <span className="text-dark-400 text-sm ml-2">#{order.orderNumber}</span>
        </div>
        <span className="text-xs text-dark-400">{elapsed} min ago</span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span>{item.quantity}x {item.productName || item.product?.name}</span>
            <span className="text-dark-400">{item.specialNote}</span>
          </div>
        ))}
      </div>

      {order.specialRequest && (
        <div className="bg-yellow-500/10 text-yellow-400 text-sm p-2 rounded-lg mb-3">
          {order.specialRequest}
        </div>
      )}

      <div className="flex gap-2">
        {activeTab === 'new' && (
          <button onClick={onAccept} className="flex-1 bg-primary-500 hover:bg-primary-600 py-2 rounded-lg text-sm font-medium">
            Accept
          </button>
        )}
        {activeTab === 'preparing' && (
          <button onClick={onReady} className="flex-1 bg-green-500 hover:bg-green-600 py-2 rounded-lg text-sm font-medium">
            Mark Ready
          </button>
        )}
        {activeTab === 'ready' && (
          <button onClick={onServe} className="flex-1 bg-blue-500 hover:bg-blue-600 py-2 rounded-lg text-sm font-medium">
            Serve
          </button>
        )}
      </div>
    </div>
  );
}
