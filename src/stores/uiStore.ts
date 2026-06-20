import { create } from 'zustand';
import { AppScreen } from '@/types';

interface UIState {
  currentScreen: AppScreen;
  isLoading: boolean;
  notifications: Array<{ id: string; type: string; message: string }>;
  setScreen: (screen: AppScreen) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: { type: string; message: string }) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentScreen: 'qr-scan',
  isLoading: false,
  notifications: [],
  setScreen: (screen) => set({ currentScreen: screen }),
  setLoading: (loading) => set({ isLoading: loading }),
  addNotification: (notification) => {
    const id = Date.now().toString();
    set((state) => ({ notifications: [...state.notifications, { id, ...notification }] }));
    setTimeout(() => {
      set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
    }, 3000);
  },
  removeNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
