import { create } from 'zustand';
import type { Screen, NavTab, CartItem, Order, ToastMessage, Product, ModalType, Restaurant, Language, WaiterRequest, WaiterRequestType, WaiterRequestStatus } from '@/types';

interface UserInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface UIState {
  currentScreen: Screen;
  previousScreen: Screen | null;
  activeTab: NavTab;
  productModalOpen: boolean;
  selectedProduct: Product | null;
  cartDrawerOpen: boolean;
  direction: number;
  toasts: ToastMessage[];
  adminMode: boolean;
  activeModal: ModalType;
  selectedRestaurant: Restaurant | null;
  language: Language;
  /* ─── Session ─── */
  isQRSession: boolean;
  tableNumber: number;
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  setScreen: (screen: Screen) => void;
  isDark: boolean;
  toggleDark: () => void;
  setLanguage: (lang: Language) => void;
  goBack: () => void;
  setActiveTab: (tab: NavTab) => void;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setAdminMode: (value: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  openRestaurant: (restaurant: Restaurant) => void;
  login: (info: UserInfo) => void;
  logout: () => void;
  setUserInfo: (info: Partial<UserInfo>) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  currentScreen: 'splash',
  previousScreen: null,
  activeTab: 'home',
  productModalOpen: false,
  selectedProduct: null,
  cartDrawerOpen: false,
  direction: 1,
  toasts: [],
  adminMode: false,
  activeModal: null,
  selectedRestaurant: null,
  language: (localStorage.getItem('fz_lang') as Language) ?? 'az',
  isDark: localStorage.getItem('fz_dark') === '1',
  isQRSession: true,
  tableNumber: 12,
  isLoggedIn: false,
  userInfo: null,

  setScreen: (screen) => {
    const current = get().currentScreen;
    set({ previousScreen: current, currentScreen: screen, direction: 1, activeModal: null });
  },

  goBack: () => {
    const prev = get().previousScreen ?? 'home';
    set({ currentScreen: prev, previousScreen: null, direction: -1 });
  },

  setActiveTab: (tab) => {
    const screenMap: Record<NavTab, Screen> = {
      home: 'home',
      search: 'search',
      orders: 'orderHistory',
      profile: 'profile',
    };
    set({ activeTab: tab, currentScreen: screenMap[tab], direction: 1, activeModal: null });
  },

  openProductModal: (product) =>
    set({ productModalOpen: true, selectedProduct: product }),

  closeProductModal: () =>
    set({ productModalOpen: false, selectedProduct: null }),

  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),

  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2500);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setAdminMode: (value) => set({ adminMode: value }),

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleDark: () => {
    const next = !get().isDark;
    localStorage.setItem('fz_dark', next ? '1' : '0');
    document.documentElement.classList.toggle('dark', next);
    set({ isDark: next });
  },

  setLanguage: (lang) => {
    localStorage.setItem('fz_lang', lang);
    set({ language: lang });
  },

  openRestaurant: (restaurant) => {
    const current = get().currentScreen;
    set({ selectedRestaurant: restaurant, previousScreen: current, currentScreen: 'restaurantDetail', direction: 1 });
  },

  login: (info) => set({ isLoggedIn: true, userInfo: info }),
  logout: () => set({ isLoggedIn: false, userInfo: null }),
  setUserInfo: (info) =>
    set((state) => ({
      userInfo: state.userInfo ? { ...state.userInfo, ...info } : { name: '', phone: '', email: '', address: '', ...info },
    })),
}));

/* ─── Cart ─── */
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) =>
          i.product.id === item.product.id &&
          i.selectedSize.id === item.selectedSize.id
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === item.product.id && i.selectedSize.id === item.selectedSize.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
    })),

  clearCart: () => set({ items: [] }),

  getSubtotal: () =>
    get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),

  getServiceFee: () => Math.round(get().getSubtotal() * 0.1 * 100) / 100,

  getTotal: () =>
    Math.round((get().getSubtotal() + get().getServiceFee()) * 100) / 100,

  getItemCount: () =>
    get().items.reduce((count, item) => count + item.quantity, 0),
}));

/* ─── Orders ─── */
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  addOrder: (order: Order) => void;
  setCurrentOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
      currentOrder: order,
    })),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, status }
          : state.currentOrder,
    })),
}));

/* ─── Support Requests ─── */
export type SupportTopic = 'order' | 'payment' | 'waiter' | 'other';
export type SupportStatus = 'sent' | 'in_review' | 'resolved';

export interface SupportRequest {
  id: string;
  topic: SupportTopic;
  message: string;
  status: SupportStatus;
  createdAt: string;
}

interface SupportRequestState {
  requests: SupportRequest[];
  addRequest: (topic: SupportTopic, message: string) => void;
}

export const useSupportRequestStore = create<SupportRequestState>((set) => ({
  requests: [],
  addRequest: (topic, message) =>
    set((state) => ({
      requests: [
        {
          id: Date.now().toString(),
          topic,
          message,
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        ...state.requests,
      ],
    })),
}));

/* ─── Waiter Requests ─── */
interface WaiterRequestState {
  requests: WaiterRequest[];
  addRequest: (type: WaiterRequestType, note: string, tableNumber: number) => void;
  updateStatus: (id: string, status: WaiterRequestStatus) => void;
  clearRequests: () => void;
}

export const useWaiterRequestStore = create<WaiterRequestState>((set) => ({
  requests: [],

  addRequest: (type, note, tableNumber) =>
    set((state) => ({
      requests: [
        {
          id: Date.now().toString(),
          type,
          status: 'pending',
          note: note || undefined,
          tableNumber,
          createdAt: new Date().toISOString(),
        },
        ...state.requests,
      ],
    })),

  updateStatus: (id, status) =>
    set((state) => ({
      requests: state.requests.map((r) => r.id === id ? { ...r, status } : r),
    })),

  clearRequests: () => set({ requests: [] }),
}));
