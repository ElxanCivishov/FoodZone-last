import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Settings,
  Tag,
  Tags,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import type { AdminTab } from './AdminApp';

export type AdminNavItem = {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
};

export type AdminNavSection = {
  id: 'overview' | 'operations' | 'business' | 'system' | 'notifications' | 'reservations';
  label: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: 'overview',
    label: 'admin.sidebar.sections.overview',
    items: [
      { id: 'dashboard', label: 'admin.dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'admin.analytics', icon: BarChart3 },
      { id: 'reports', label: 'admin.reports', icon: FileText },
    ],
  },
  {
    id: 'operations',
    label: 'admin.sidebar.sections.operations',
    items: [
      { id: 'orders', label: 'admin.orders', icon: ClipboardList },
      { id: 'menu', label: 'admin.menu', icon: Utensils },
      { id: 'categories', label: 'admin.categories.title', icon: Tags },
      { id: 'qr', label: 'admin.tables', icon: LayoutGrid },
    ],
  },
  {
    id: 'business',
    label: 'admin.sidebar.sections.business',
    items: [
      { id: 'inventory', label: 'admin.inventory', icon: Package },
      { id: 'cashier', label: 'admin.cashier', icon: Wallet },
      { id: 'customers', label: 'admin.customers', icon: Users },
      { id: 'reservations', label: 'admin.reservations', icon: CalendarCheck },
      { id: 'promo', label: 'admin.promo', icon: Tag },
      { id: 'staff', label: 'admin.staff', icon: CalendarClock },
    ],
  },
  {
    id: 'system',
    label: 'admin.sidebar.sections.system',
    items: [
      { id: 'branches', label: 'admin.branches', icon: Building2 },
      { id: 'settings', label: 'admin.settings', icon: Settings },
      { id: 'notifications', label: 'admin.notifications', icon: Bell },
    ],
  },
];

export const adminRouteItems: AdminNavItem[] = [
  ...adminNavSections.flatMap((section) => section.items),
];

export function getAdminRouteItem(pathname: string) {
  const routeId = pathname.split('/').filter(Boolean)[1] as AdminTab | undefined;
  return adminRouteItems.find((item) => item.id === routeId) ?? adminRouteItems[0];
}
