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

export const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

export const STORAGE_KEYS = {
  SESSION: 'fz_session',
  CART: 'fz_cart',
  LANGUAGE: 'fz_language',
  THEME: 'fz_theme',
} as const;

export const SOCKET_EVENTS = {
  JOIN_TABLE: 'join:table',
  LEAVE_TABLE: 'leave:table',
  PLACE_ORDER: 'order:place',
  CALL_WAITER: 'waiter:call',
  ORDER_STATUS_UPDATE: 'order:status:update',
  ORDER_READY: 'order:ready',
  WAITER_ACCEPTED: 'waiter:accepted',
  NEW_ORDER: 'order:new',
  TABLE_UPDATE: 'table:update',
} as const;

export type OrderStatus = typeof ORDER_STATUS_FLOW[number];
