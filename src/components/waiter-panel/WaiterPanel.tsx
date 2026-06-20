import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWaiterStore } from '@/stores/waiterStore';
import { useSocketContext } from '@/services/socket';
import { useWaiterRequests } from '@/hooks/useDashboard';
import { useOrders } from '@/hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { patch } from '@/services/api';
import { UserCheck, Bell, CheckCircle, ClipboardList } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function WaiterPanel() {
  const { t } = useTranslation();
  const { socket, isConnected } = useSocketContext();
  const { activeTab, setActiveTab, setOrders, setRequests, addOrder, addRequest, updateRequest, removeOrder, removeRequest } = useWaiterStore();
  const queryClient = useQueryClient();

  const { data: requestsData } = useWaiterRequests('pending');
  const { data: ordersData } = useOrders({ status: 'ready' });

  useEffect(() => {
    if (requestsData?.data) setRequests(requestsData.data);
  }, [requestsData, setRequests]);

  useEffect(() => {
    if (ordersData?.data) setOrders(ordersData.data);
  }, [ordersData, setOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('room:join', { room: 'waiters', role: 'waiter' });

    const handleNewRequest = (data: any) => {
      addRequest(data);
      toast(`New request from Table ${data.tableNumber || data.tableId}`);
    };

    const handleNewOrder = (data: any) => {
      addOrder(data);
      toast(`Order ready for Table ${data.tableId}`);
    };

    socket.on('waiter:new:request', handleNewRequest);
    socket.on('waiter:new:order', handleNewOrder);

    return () => {
      socket.off('waiter:new:request', handleNewRequest);
      socket.off('waiter:new:order', handleNewOrder);
      socket.emit('room:leave', { room: 'waiters' });
    };
  }, [socket, addRequest, addOrder, setOrders, setRequests]);

  const handleAcceptRequest = async (id: string) => {
    try {
      await patch(`/waiter-requests/${id}/status`, { status: 'accepted' });
      updateRequest(id, 'accepted');
      queryClient.invalidateQueries({ queryKey: ['waiter-requests'] });
    } catch (err: any) {
      toast.error(err?.message);
    }
  };

  const handleCompleteRequest = async (id: string) => {
    try {
      await patch(`/waiter-requests/${id}/status`, { status: 'done' });
      removeRequest(id);
      queryClient.invalidateQueries({ queryKey: ['waiter-requests'] });
    } catch (err: any) {
      toast.error(err?.message);
    }
  };

  const handleServeOrder = async (orderId: string) => {
    try {
      await patch(`/orders/${orderId}/status`, { status: 'served' });
      removeOrder(orderId);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err: any) {
      toast.error(err?.message);
    }
  };

  const tabs = [
    { id: 'orders', label: t('waiterPanel.ordersToServe'), icon: ClipboardList },
    { id: 'requests', label: t('waiterPanel.newRequests'), icon: Bell },
  ];

  const store = useWaiterStore();
  const items = activeTab === 'orders' ? store.orders : store.requests;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-30 bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Waiter Panel</h1>
            <p className="text-xs text-foreground-muted">Active requests & orders</p>
          </div>
        </div>
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          isConnected ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'
        )}>
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </header>

      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3 max-w-2xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-foreground-muted">
              <p className="text-lg mb-1">{activeTab === 'orders' ? t('waiterPanel.noOrders') : t('waiterPanel.noRequests')}</p>
              <p className="text-sm">Items will appear here automatically</p>
            </div>
          ) : (
            items.map((item: any) => (
              <div key={item.id} className="bg-surface-elevated border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">Table {item.tableNumber || item.table?.number || '?'}</p>
                    <p className="text-sm text-foreground-muted">
                      {activeTab === 'orders' ? `#${item.orderNumber}` : item.type}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full font-medium">
                    {item.status}
                  </span>
                </div>

                {activeTab === 'orders' && item.items && (
                  <div className="space-y-1 mb-3">
                    {item.items.slice(0, 3).map((it: any, i: number) => (
                      <p key={i} className="text-sm text-foreground-muted">
                        {it.quantity}x {it.productName || it.product?.name}
                      </p>
                    ))}
                  </div>
                )}

                {item.message && (
                  <p className="text-sm text-foreground-muted mb-3 bg-foreground-muted/5 p-2 rounded-lg">
                    {item.message}
                  </p>
                )}

                <div className="flex gap-2">
                  {activeTab === 'requests' && item.status === 'pending' && (
                    <button
                      onClick={() => handleAcceptRequest(item.id)}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      {t('waiterPanel.accept')}
                    </button>
                  )}
                  {activeTab === 'requests' && item.status === 'accepted' && (
                    <button
                      onClick={() => handleCompleteRequest(item.id)}
                      className="flex-1 py-2 bg-success-500 text-white rounded-xl text-sm font-medium hover:bg-success-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('waiterPanel.complete')}
                    </button>
                  )}
                  {activeTab === 'orders' && (
                    <button
                      onClick={() => handleServeOrder(item.id)}
                      className="flex-1 py-2 bg-success-500 text-white rounded-xl text-sm font-medium hover:bg-success-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Served
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
