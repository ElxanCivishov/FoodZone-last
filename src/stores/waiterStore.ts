import { create } from 'zustand';
import { WaiterOrder, WaiterRequestItem } from '@/types';

interface WaiterState {
  orders: WaiterOrder[];
  pendingRequests: WaiterRequestItem[];
  acceptedRequests: WaiterRequestItem[];
  activeTab: 'orders' | 'requests';
  setActiveTab: (tab: 'orders' | 'requests') => void;
  serveOrder: (orderId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  acceptRequest: (requestId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  completeRequest: (requestId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  addOrder: (order: WaiterOrder) => void;
  addRequest: (request: WaiterRequestItem) => void;
}

export const useWaiterStore = create<WaiterState>((set, get) => ({
  orders: [],
  pendingRequests: [],
  acceptedRequests: [],
  activeTab: 'orders',
  setActiveTab: (tab) => set({ activeTab: tab }),
  serveOrder: (orderId, emitEvent) => {
    set({ orders: get().orders.filter((o) => o.id !== orderId) });
    if (emitEvent) emitEvent('order:served', { orderId });
  },
  acceptRequest: (requestId, emitEvent) => {
    const { pendingRequests, acceptedRequests } = get();
    const request = pendingRequests.find((r) => r.id === requestId);
    if (!request) return;
    set({
      pendingRequests: pendingRequests.filter((r) => r.id !== requestId),
      acceptedRequests: [...acceptedRequests, { ...request, status: 'accepted' as const }],
    });
    if (emitEvent) emitEvent('waiter:request:accepted', { requestId, tableId: request.tableId, waiterId: 'waiter-1' });
  },
  completeRequest: (requestId, emitEvent) => {
    const { acceptedRequests } = get();
    const request = acceptedRequests.find((r) => r.id === requestId);
    if (!request) return;
    set({ acceptedRequests: acceptedRequests.filter((r) => r.id !== requestId) });
    if (emitEvent) emitEvent('waiter:request:completed', { requestId, tableId: request.tableId });
  },
  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  addRequest: (request) => set({ pendingRequests: [request, ...get().pendingRequests] }),
}));
