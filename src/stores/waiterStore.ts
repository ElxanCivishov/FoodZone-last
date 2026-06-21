import { create } from 'zustand';
import { Order, WaiterRequest } from '@/types';

export type WaiterPanelTab = 'orders' | 'requests' | 'accepted' | 'rejected';

interface WaiterState {
  orders: Order[];
  requests: WaiterRequest[];
  activeTab: WaiterPanelTab;
  isConnected: boolean;
  setOrders: (orders: Order[]) => void;
  setRequests: (requests: WaiterRequest[]) => void;
  addOrder: (order: Order) => void;
  addRequest: (request: WaiterRequest) => void;
  updateRequest: (requestId: string, status: WaiterRequest['status']) => void;
  removeOrder: (orderId: string) => void;
  removeRequest: (requestId: string) => void;
  setActiveTab: (tab: WaiterPanelTab) => void;
  setConnected: (connected: boolean) => void;
}

export const useWaiterStore = create<WaiterState>((set) => ({
  orders: [],
  requests: [],
  activeTab: 'orders',
  isConnected: false,

  setOrders: (orders) => set({ orders }),
  setRequests: (requests) => set({ requests }),
  addOrder: (order) =>
    set((state) => {
      const exists = state.orders.some((o) => o.id === order.id);
      return {
        orders: exists
          ? state.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o))
          : [order, ...state.orders],
      };
    }),
  addRequest: (request) =>
    set((state) => {
      const exists = state.requests.some((r) => r.id === request.id);
      return {
        requests: exists
          ? state.requests.map((r) => (r.id === request.id ? { ...r, ...request } : r))
          : [request, ...state.requests],
      };
    }),
  updateRequest: (requestId, status) =>
    set((state) => ({
      requests: state.requests.map((r) => (r.id === requestId ? { ...r, status } : r)),
    })),
  removeOrder: (orderId) =>
    set((state) => ({ orders: state.orders.filter((o) => o.id !== orderId) })),
  removeRequest: (requestId) =>
    set((state) => ({ requests: state.requests.filter((r) => r.id !== requestId) })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setConnected: (connected) => set({ isConnected: connected }),
}));
