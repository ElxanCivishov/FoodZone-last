import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { STORAGE_KEYS, SERVICE_FEE_PERCENTAGE } from '@/utils/constants';

interface CartState {
  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const serviceFee = subtotal * (SERVICE_FEE_PERCENTAGE / 100);
  const total = subtotal + serviceFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, serviceFee, discount: 0, total, itemCount };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      serviceFee: 0,
      discount: 0,
      total: 0,
      itemCount: 0,

      addItem: (itemData) => {
        const items = get().items;
        const existingItem = items.find(
          (i) =>
            i.productId === itemData.productId &&
            i.selectedSize?.id === itemData.selectedSize?.id &&
            JSON.stringify(i.selectedExtras.map((e) => e.id).sort()) ===
              JSON.stringify(itemData.selectedExtras.map((e) => e.id).sort()) &&
            i.specialNote === itemData.specialNote
        );
        if (existingItem) {
          get().updateQuantity(existingItem.id, existingItem.quantity + itemData.quantity);
          return;
        }
        const newItem: CartItem = {
          ...itemData,
          id: generateId(),
          totalPrice: itemData.unitPrice * itemData.quantity,
        };
        const newItems = [...items, newItem];
        set({ items: newItems, ...calculateTotals(newItems) });
      },

      removeItem: (itemId) => {
        const newItems = get().items.filter((i) => i.id !== itemId);
        set({ items: newItems, ...calculateTotals(newItems) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        const newItems = get().items.map((item) =>
          item.id === itemId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );
        set({ items: newItems, ...calculateTotals(newItems) });
      },

      clearCart: () =>
        set({ items: [], subtotal: 0, serviceFee: 0, discount: 0, total: 0, itemCount: 0 }),
    }),
    {
      name: STORAGE_KEYS.CART,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totals = calculateTotals(state.items || []);
          Object.assign(state, totals);
        }
      },
    }
  )
);
