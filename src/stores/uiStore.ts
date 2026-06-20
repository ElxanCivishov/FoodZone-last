import { create } from "zustand";
import { AppScreen } from "@/types";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface UIState {
  currentScreen: AppScreen;
  isLoading: boolean;
  notifications: Notification[];
  sidebarOpen: boolean;
  setScreen: (screen: AppScreen) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  currentScreen: "qr-scan",
  isLoading: false,
  notifications: [],
  sidebarOpen: false,

  setScreen: (screen) => set({ currentScreen: screen }),
  setLoading: (loading) => set({ isLoading: loading }),

  addNotification: (notification) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      notifications: [...state.notifications, { id, ...notification }],
    }));
    setTimeout(() => {
      get().removeNotification(id);
    }, 4000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
