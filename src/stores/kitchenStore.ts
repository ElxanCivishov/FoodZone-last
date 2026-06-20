import { create } from 'zustand';
import { Order } from '@/types';

interface KitchenState {
  orders: Order[];
  activeTab: 'new' | 'preparing' | 'ready';
  isConnected: boolean;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  setActiveTab: (tab: 'new' | 'preparing' | 'ready') => void;
  setConnected: (connected: boolean) => void;
  acceptOrder: (orderId: string) => void;
  markReady: (orderId: string) => void;
  markServed: (orderId: string) => void;
}

export const useKitchenStore = create<KitchenState>((set, _get) => ({
  orders: [],
  activeTab: 'new',
  isConnected: false,

  setOrders: (orders) => set({ orders }),
  addOrder: (order) =>
    set((state) => {
      const exists = state.orders.some((o) => o.id === order.id);
      return {
        orders: exists
          ? state.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o))
          : [order, ...state.orders],
      };
    }),
  updateOrder: (orderId, updates) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)),
    })),
  removeOrder: (orderId) =>
    set((state) => ({ orders: state.orders.filter((o) => o.id !== orderId) })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setConnected: (connected) => set({ isConnected: connected }),

  acceptOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, status: 'preparing' as const } : o),
    }));
  },
  markReady: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, status: 'ready' as const } : o),
    }));
  },
  markServed: (orderId) => {
    set((state) => ({ orders: state.orders.filter((o) => o.id !== orderId) }));
  },
}));
