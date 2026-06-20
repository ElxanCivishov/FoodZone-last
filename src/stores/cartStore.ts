import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { STORAGE_KEYS, SERVICE_FEE_PERCENTAGE } from '@/utils/constants';

interface CartState {
  items: CartItem[];
  coupon: { code: string; discountType: 'percentage' | 'fixed'; discountValue: number; maxDiscount?: number } | null;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: CartState['coupon']) => boolean;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      subtotal: 0,
      serviceFee: 0,
      discount: 0,
      total: 0,
      itemCount: 0,
      addItem: (itemData) => {
        const items = get().items;
        const existingItem = items.find(
          (i) => i.productId === itemData.productId &&
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
        updateTotals(set, get, [...items, newItem]);
      },
      removeItem: (itemId) => {
        updateTotals(set, get, get().items.filter((i) => i.id !== itemId));
      },
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) { get().removeItem(itemId); return; }
        const newItems = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity, totalPrice: item.unitPrice * quantity } : item
        );
        updateTotals(set, get, newItems);
      },
      clearCart: () => set({ items: [], coupon: null, subtotal: 0, serviceFee: 0, discount: 0, total: 0, itemCount: 0 }),
      applyCoupon: (coupon) => {
        const subtotal = get().subtotal;
        if (coupon?.minOrderAmount && subtotal < coupon.minOrderAmount) return false;
        set({ coupon });
        updateTotals(set, get, get().items);
        return true;
      },
      removeCoupon: () => {
        set({ coupon: null });
        updateTotals(set, get, get().items);
      },
    }),
    {
      name: STORAGE_KEYS.CART,
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
);

function updateTotals(set: any, get: any, items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const serviceFee = subtotal * (SERVICE_FEE_PERCENTAGE / 100);
  const coupon = get().coupon;
  let discount = 0;
  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, subtotal);
  }
  const total = subtotal + serviceFee - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  set(() => ({ items, subtotal, serviceFee, discount, total, itemCount }));
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
