import { create } from 'zustand';
import { Order, OrderStatusUpdate } from '@/types';
import { post } from '@/services/api';

interface OrderState {
  currentOrder: Order | null;
  orders: Order[];
  isPlacingOrder: boolean;
  orderError: string | null;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (orderData: unknown) => Promise<Order>;
  updateOrderStatus: (update: OrderStatusUpdate) => void;
  addOrder: (order: Order) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrder: null,
  orders: [],
  isPlacingOrder: false,
  orderError: null,

  setCurrentOrder: (order) => set({ currentOrder: order }),

  placeOrder: async (orderData) => {
    set({ isPlacingOrder: true, orderError: null });
    try {
      const response = await post<Order>('/orders', orderData);
      const order = response.data;
      set({
        currentOrder: order,
        isPlacingOrder: false,
        orders: [order, ...get().orders],
      });
      return order;
    } catch (error: any) {
      set({ orderError: error?.message || 'Failed to place order', isPlacingOrder: false });
      throw error;
    }
  },

  updateOrderStatus: (update) => {
    const { currentOrder, orders } = get();
    if (currentOrder && currentOrder.id === update.orderId) {
      set({ currentOrder: { ...currentOrder, status: update.status } });
    }
    set({
      orders: orders.map((o) =>
        o.id === update.orderId ? { ...o, status: update.status } : o
      ),
    });
  },

  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  clearCurrentOrder: () => set({ currentOrder: null }),
}));
