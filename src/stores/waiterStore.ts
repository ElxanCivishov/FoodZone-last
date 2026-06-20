import { create } from 'zustand';
import { Order, WaiterRequest } from '@/types';

interface WaiterState {
  orders: Order[];
  requests: WaiterRequest[];
  activeTab: 'orders' | 'requests';
  isConnected: boolean;
  setOrders: (orders: Order[]) => void;
  setRequests: (requests: WaiterRequest[]) => void;
  addOrder: (order: Order) => void;
  addRequest: (request: WaiterRequest) => void;
  updateRequest: (requestId: string, status: 'accepted' | 'done') => void;
  removeOrder: (orderId: string) => void;
  removeRequest: (requestId: string) => void;
  setActiveTab: (tab: 'orders' | 'requests') => void;
  setConnected: (connected: boolean) => void;
}

export const useWaiterStore = create<WaiterState>((set) => ({
  orders: [],
  requests: [],
  activeTab: 'orders',
  isConnected: false,

  setOrders: (orders) => set({ orders }),
  setRequests: (requests) => set({ requests }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
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
