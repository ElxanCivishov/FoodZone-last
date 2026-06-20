export const LANGUAGES = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿', native: 'Azərbaycan dili' },
  { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', native: 'Русский' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', native: 'Türkçe' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

export const WAITER_REQUEST_TYPES = [
  { id: 'call', icon: 'Bell', label: 'waiter.call' },
  { id: 'water', icon: 'Droplets', label: 'waiter.water' },
  { id: 'napkin', icon: 'ScrollText', label: 'waiter.napkin' },
  { id: 'bill', icon: 'Receipt', label: 'waiter.bill' },
  { id: 'clean', icon: 'Sparkles', label: 'waiter.clean' },
  { id: 'other', icon: 'MessageCircle', label: 'waiter.other' },
] as const;

export const SERVICE_FEE_PERCENTAGE = 5;
export const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'served'] as const;
export type OrderStatus = typeof ORDER_STATUS_FLOW[number];

export const STORAGE_KEYS = {
  SESSION: 'fz_session',
  CART: 'fz_cart',
  LANGUAGE: 'fz_language',
  THEME: 'fz_theme',
  TOKEN: 'token',
} as const;

export const SOCKET_EVENTS = {
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ORDER_PLACED: 'order:placed',
  ORDER_STATUS_CHANGED: 'order:status:changed',
  ORDER_ACCEPTED: 'order:accepted',
  ORDER_ITEM_READY: 'order:item:ready',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',
  KITCHEN_NEW_ORDER: 'kitchen:new:order',
  WAITER_NEW_ORDER: 'waiter:new:order',
  WAITER_NEW_REQUEST: 'waiter:new:request',
  WAITER_REQUEST_ACCEPTED: 'waiter:request:accepted',
  WAITER_REQUEST_COMPLETED: 'waiter:request:completed',
  CUSTOMER_ORDER_UPDATE: 'customer:order:update',
  CUSTOMER_WAITER_ACCEPTED: 'customer:waiter:accepted',
  CUSTOMER_ORDER_READY: 'customer:order:ready',
  NOTIFICATION: 'notification',
} as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-green-500',
  served: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
};
