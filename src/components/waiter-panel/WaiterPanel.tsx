import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { useSocketContext } from '@/services/socket';
import { useWaiterStore } from '@/stores/waiterStore';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/utils/constants';

export function WaiterPanel() {
  const { socket, joinRoom, isConnected } = useSocketContext();
  const { data: readyOrdersData } = useQuery({
    queryKey: ['waiter-orders'],
    queryFn: () => get('/orders', { status: 'ready' }),
    refetchInterval: 10000,
  });

  const { data: requestsData } = useQuery({
    queryKey: ['waiter-requests'],
    queryFn: () => get('/waiter-requests', { status: 'pending,accepted' }),
    refetchInterval: 5000,
  });

  const { orders, pendingRequests, acceptedRequests, activeTab, setActiveTab, serveOrder, acceptRequest, completeRequest, addOrder, addRequest } = useWaiterStore();

  useEffect(() => {
    joinRoom('waiters', 'waiter');

    socket?.on('waiter:new:order', (order) => addOrder(order));
    socket?.on('waiter:new:request', (request) => addRequest(request));

    return () => {
      socket?.off('waiter:new:order');
      socket?.off('waiter:new:request');
    };
  }, [socket, joinRoom, addOrder, addRequest]);

  useEffect(() => {
    if (readyOrdersData?.data) {
      readyOrdersData.data.forEach((order: any) => addOrder(order));
    }
  }, [readyOrdersData, addOrder]);

  useEffect(() => {
    if (requestsData?.data) {
      requestsData.data.forEach((req: any) => {
        if (req.status === 'pending') addRequest(req);
      });
    }
  }, [requestsData, addRequest]);

  const tabs = [
    { id: 'orders', label: 'Orders', count: orders.length },
    { id: 'requests', label: 'Requests', count: pendingRequests.length + acceptedRequests.length },
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Waiter Panel</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-dark-400 py-10">No orders ready to serve</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-dark-800 rounded-xl border border-dark-700 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Order #{order.orderNumber}</p>
                    <p className="text-sm text-dark-400">Table {order.tableNumber}</p>
                    <p className="text-sm text-primary-400">${order.total.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => serveOrder(order.id, (event, data) => socket?.emit(event, data))}
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Serve
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3">
            {[...pendingRequests, ...acceptedRequests].length === 0 ? (
              <p className="text-center text-dark-400 py-10">No pending requests</p>
            ) : (
              [...pendingRequests, ...acceptedRequests].map((request) => (
                <div key={request.id} className="bg-dark-800 rounded-xl border border-dark-700 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold capitalize">{request.type}</p>
                    <p className="text-sm text-dark-400">Table {request.tableNumber}</p>
                    {request.message && <p className="text-sm text-dark-400">{request.message}</p>}
                  </div>
                  {request.status === 'pending' ? (
                    <button
                      onClick={() => acceptRequest(request.id, (event, data) => socket?.emit(event, data))}
                      className="bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Accept
                    </button>
                  ) : (
                    <button
                      onClick={() => completeRequest(request.id, (event, data) => socket?.emit(event, data))}
                      className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
