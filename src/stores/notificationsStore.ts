import { create } from 'zustand';
import api from '@/services/api';

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx() as AudioContext;
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    master.gain.value = 0.55;
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    const notes = [
      { freq: 880, start: 0,    duration: 0.18, vol: 0.22 },
      { freq: 1108, start: 0.14, duration: 0.22, vol: 0.18 },
    ];

    notes.forEach(({ freq, start, duration, vol }) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });

    setTimeout(() => ctx.close(), 800);
  } catch {
    // AudioContext not available
  }
}

const TOAST_DURATION_MS = 5000;

export type NotificationType = 'star' | 'mail' | 'system' | 'social' | 'message' | 'alert' | 'promo';

export type BackendNotifType =
  | 'new_order' | 'payment_received' | 'order_cancelled'
  | 'sla_breach' | 'low_stock' | 'system';

export type NotificationPreferences = {
  sound: boolean;
  // Admin bildirişləri
  new_order: boolean;
  payment_received: boolean;
  order_cancelled: boolean;
  sla_breach: boolean;
  low_stock: boolean;
  system: boolean;
  // Waiter panel bildirişləri
  waiter_new_request: boolean;
  waiter_order_ready: boolean;
  waiter_sound: boolean;
  // Kitchen panel bildirişləri
  kitchen_new_order: boolean;
  kitchen_sound: boolean;
};

const PREFS_KEY = 'notif-prefs-v1';

function loadPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch { /* */ }
  return defaultPrefs();
}

function defaultPrefs(): NotificationPreferences {
  return {
    sound: true,
    new_order: true,
    payment_received: true,
    order_cancelled: true,
    sla_breach: true,
    low_stock: true,
    system: true,
    waiter_new_request: true,
    waiter_order_ready: true,
    waiter_sound: true,
    kitchen_new_order: true,
    kitchen_sound: true,
  };
}

export type AdminNotification = {
  id: string;
  title: string;
  description: string;
  time: Date;
  type: NotificationType;
  backendType?: BackendNotifType;
  featured?: boolean;
  avatarInitial?: string;
  read: boolean;
};

const EXAMPLE_POOL: Omit<AdminNotification, 'id' | 'time' | 'read'>[] = [
  { title: 'Yeni sifariş alındı', description: 'Masa 5-dən yeni sifariş daxil oldu.', type: 'alert' },
  { title: 'Gündəlik hədəf', description: 'Bu günün hədəfiniz tamamlandı!', type: 'star' },
  { title: 'Poçt qutusu', description: '15 oxunmamış mesajınız var.', type: 'mail' },
  { title: 'Sistem yeniləməsi', description: 'Yeni versiya mövcuddur, yeniləyin.', type: 'system' },
  { title: 'Yeni müştəri', description: 'Elvin Məmmədov sisteme qeydiyyatdan keçdi.', type: 'social', avatarInitial: 'E' },
  { title: 'Birbaşa mesaj', description: 'Leyla Əliyeva sizə mesaj göndərdi.', type: 'message', avatarInitial: 'L' },
  { title: 'Endirim kampaniyası', description: 'Yaz endirimi 3 gündən sonra başlayır.', type: 'promo' },
  { title: 'Əla iş!', description: 'Komandanız bu həftə 200 sifariş tamamladı.', type: 'star' },
];

const INITIAL: AdminNotification[] = [
  {
    id: '1',
    title: 'FoodZonee yeni versiyası',
    description: 'Buraxılış qeydlərini ətraflı oxuyun.',
    time: new Date(Date.now() - 10 * 60 * 1000),
    type: 'alert',
    featured: true,
    read: false,
  },
  {
    id: '2',
    title: 'Gündəlik hədəf',
    description: 'Sifarişiniz qəbul edildi.',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'star',
    read: false,
  },
  {
    id: '3',
    title: 'Ceyhun Əliyev sizi əlavə etdi',
    description: 'Gizli Layihə qrupuna əlavə edildiniz...',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'social',
    avatarInitial: 'C',
    read: false,
  },
  {
    id: '4',
    title: 'Poçt qutusu',
    description: '3 poçt qutusunda 15 oxunmamış məktub var.',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'mail',
    read: false,
  },
  {
    id: '5',
    title: 'Rauf İsmayılov dostluq istəyini qəbul etdi',
    description: '',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'social',
    avatarInitial: 'R',
    read: true,
  },
  {
    id: '6',
    title: 'Günel Hüseynova birbaşa mesaj göndərdi',
    description: '',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'message',
    avatarInitial: 'G',
    read: true,
  },
  {
    id: '7',
    title: 'Cron tapşırıqları',
    description: 'Docker konteyneri nəşrə hazırdır.',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'system',
    read: true,
  },
  {
    id: '8',
    title: 'Poçt qutusu',
    description: '3 yeni məktubunuz var.',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'mail',
    read: true,
  },
  {
    id: '9',
    title: 'Gündəlik hədəf',
    description: 'Sifarişiniz qəbul edildi və siz artıq...',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'star',
    read: true,
  },
  {
    id: '10',
    title: 'Cron tapşırıqları',
    description: 'Vagrant konteyneri yükləməyə hazırdır.',
    time: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000),
    type: 'system',
    read: true,
  },
  {
    id: '11',
    title: 'Əla iş! Bu möhtəşəmdir.',
    description: '',
    time: new Date(Date.now() - 2 * 60 * 1000),
    type: 'star',
    read: false,
  },
];

let _nextId = 100;

export type ToastNotification = AdminNotification & { toastId: string };

interface NotificationsState {
  notifications: AdminNotification[];
  toasts: ToastNotification[];
  exampleIndex: number;
  soundEnabled: boolean;
  apiLoaded: boolean;
  prefs: NotificationPreferences;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  dismissToast: (toastId: string) => void;
  addExample: () => void;
  addSocketNotification: (n: Omit<AdminNotification, 'featured'>) => void;
  loadFromApi: (branchId?: string) => Promise<void>;
  markAllReadApi: (branchId?: string) => Promise<void>;
  dismissApi: (id: string) => void;
  markAllRead: () => void;
  toggleSound: () => void;
  setPref: (key: keyof NotificationPreferences, value: boolean) => void;
  unreadCount: () => number;
}

function backendTypeToFrontend(type: string): NotificationType {
  if (type === 'low_stock') return 'alert';
  if (type === 'payment_received') return 'star';
  if (type === 'order_cancelled') return 'alert';
  if (type === 'sla_breach') return 'system';
  return 'system';
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: INITIAL,
  toasts: [],
  exampleIndex: 0,
  soundEnabled: localStorage.getItem('notifications-sound') !== 'off',
  apiLoaded: false,
  prefs: loadPrefs(),

  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  dismissAll: () => set({ notifications: [] }),

  dismissToast: (toastId) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.toastId !== toastId) })),

  addSocketNotification: (n) => {
    const { soundEnabled, prefs } = get();
    const exists = get().notifications.some((x) => x.id === n.id);
    if (exists) return;
    if (n.backendType && !prefs[n.backendType as keyof NotificationPreferences]) return;
    if (soundEnabled && prefs.sound) playNotificationSound();
    const toastId = `toast-${n.id}`;
    set((state) => ({
      notifications: [n, ...state.notifications],
      toasts: [...state.toasts, { ...n, toastId }].slice(-5),
    }));
    setTimeout(() => {
      useNotificationsStore.getState().dismissToast(toastId);
    }, TOAST_DURATION_MS);
  },

  addExample: () => {
    const { exampleIndex, soundEnabled, prefs } = get();
    const template = EXAMPLE_POOL[exampleIndex % EXAMPLE_POOL.length];
    const id = String(++_nextId);
    if (soundEnabled && prefs.sound) playNotificationSound();
    const toastId = `toast-${id}`;
    set((state) => ({
      notifications: [{ ...template, id, time: new Date(), read: false }, ...state.notifications],
      toasts: [...state.toasts, { ...template, id, time: new Date(), read: false, toastId }].slice(-5),
      exampleIndex: state.exampleIndex + 1,
    }));
    setTimeout(() => {
      useNotificationsStore.getState().dismissToast(toastId);
    }, TOAST_DURATION_MS);
  },

  loadFromApi: async (branchId) => {
    try {
      const url = branchId ? `/notifications?branchId=${branchId}&limit=50` : '/notifications?limit=50';
      const res: any = await api.get(url);
      const items: AdminNotification[] = (res.data ?? []).map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        time: new Date(n.createdAt),
        type: backendTypeToFrontend(n.type),
        read: n.isRead,
      }));
      set({ notifications: items, apiLoaded: true });
    } catch {
      set({ apiLoaded: true });
    }
  },

  dismissApi: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
    api.delete(`/notifications/${id}`).catch(() => {});
  },

  markAllReadApi: async (branchId) => {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
    await api.patch('/notifications/mark-all-read', { branchId }).catch(() => {});
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  toggleSound: () =>
    set((state) => {
      const next = !state.soundEnabled;
      localStorage.setItem('notifications-sound', next ? 'on' : 'off');
      return { soundEnabled: next };
    }),

  setPref: (key, value) =>
    set((state) => {
      const next = { ...state.prefs, [key]: value };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return { prefs: next };
    }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
