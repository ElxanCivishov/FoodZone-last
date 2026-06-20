import { create } from 'zustand';
import { Order, OrderStatusUpdate } from '@/types';

interface OrderState {
  currentOrder: Order | null;
  orders: Order[];
  isPlacingOrder: boolean;
  orderError: string | null;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (orderData: unknown, socketEmit?: (event: string, data: unknown) => void) => Promise<Order>;
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
  placeOrder: async (orderData, socketEmit) => {
    set({ isPlacingOrder: true, orderError: null });
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }
      const order: Order = await response.json();
      if (socketEmit) {
        socketEmit('order:placed', {
          orderId: order.id, tableId: order.tableId, branchId: order.branchId,
          orderNumber: order.orderNumber, items: order.items, total: order.total, status: order.status,
        });
      }
      set({ currentOrder: order, isPlacingOrder: false, orders: [order, ...get().orders] });
      return order;
    } catch (error) {
      set({ orderError: error instanceof Error ? error.message : 'Unknown error', isPlacingOrder: false });
      throw error;
    }
  },
  updateOrderStatus: (update) => {
    const { currentOrder, orders } = get();
    if (currentOrder && currentOrder.id === update.orderId) {
      set({ currentOrder: { ...currentOrder, status: update.status } });
    }
    set({ orders: orders.map((o) => o.id === update.orderId ? { ...o, status: update.status } : o) });
  },
  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  clearCurrentOrder: () => set({ currentOrder: null }),
}));
