import { create } from 'zustand';
import { KitchenOrder } from '@/types';

interface KitchenState {
  newOrders: KitchenOrder[];
  preparingOrders: KitchenOrder[];
  readyOrders: KitchenOrder[];
  activeTab: 'new' | 'preparing' | 'ready';
  setActiveTab: (tab: 'new' | 'preparing' | 'ready') => void;
  acceptOrder: (orderId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  markItemReady: (orderId: string, itemId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  markOrderReady: (orderId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  serveOrder: (orderId: string, emitEvent?: (event: string, data: unknown) => void) => void;
  addOrder: (order: KitchenOrder) => void;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  newOrders: [],
  preparingOrders: [],
  readyOrders: [],
  activeTab: 'new',
  setActiveTab: (tab) => set({ activeTab: tab }),
  acceptOrder: (orderId, emitEvent) => {
    const { newOrders, preparingOrders } = get();
    const order = newOrders.find((o) => o.id === orderId);
    if (!order) return;
    const updatedOrder = { ...order, status: 'preparing' as const, startedAt: new Date().toISOString() };
    set({ newOrders: newOrders.filter((o) => o.id !== orderId), preparingOrders: [...preparingOrders, updatedOrder] });
    if (emitEvent) emitEvent('order:accepted', { orderId, tableId: order.tableId, estimatedTime: order.estimatedTime });
  },
  markItemReady: (orderId, itemId, emitEvent) => {
    const { preparingOrders } = get();
    const orderIndex = preparingOrders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;
    const order = preparingOrders[orderIndex];
    const updatedItems = order.items.map((item) => item.id === itemId ? { ...item, status: 'ready' as const } : item);
    const updatedOrder = { ...order, items: updatedItems };
    const newPreparing = [...preparingOrders];
    newPreparing[orderIndex] = updatedOrder;
    set({ preparingOrders: newPreparing });
    if (emitEvent) emitEvent('order:item:ready', { orderId, itemId, tableId: order.tableId });
  },
  markOrderReady: (orderId, emitEvent) => {
    const { preparingOrders, readyOrders } = get();
    const order = preparingOrders.find((o) => o.id === orderId);
    if (!order) return;
    const updatedOrder = { ...order, status: 'ready' as const, readyAt: new Date().toISOString() };
    set({ preparingOrders: preparingOrders.filter((o) => o.id !== orderId), readyOrders: [...readyOrders, updatedOrder] });
    if (emitEvent) emitEvent('order:ready', { orderId, tableId: order.tableId });
  },
  serveOrder: (orderId, emitEvent) => {
    const { readyOrders } = get();
    const order = readyOrders.find((o) => o.id === orderId);
    if (!order) return;
    set({ readyOrders: readyOrders.filter((o) => o.id !== orderId) });
    if (emitEvent) emitEvent('order:served', { orderId, tableId: order.tableId, waiterId: 'waiter-1' });
  },
  addOrder: (order) => set({ newOrders: [order, ...get().newOrders] }),
}));
