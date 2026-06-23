import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  Utensils,
  Users,
  Wallet,
  Package,
  FileText,
  Tag,
  CalendarClock,
  Building2,
  LayoutGrid,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import type { AdminTab } from '../AdminApp';
import { useActiveBranch } from '../hooks/useActiveBranch';

const tabs = [
  { id: 'dashboard', label: 'admin.dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'admin.orders', icon: ClipboardList },
  { id: 'menu', label: 'admin.menu', icon: Utensils },
  { id: 'categories', label: 'admin.categories.title', icon: Tags },
  { id: 'inventory', label: 'admin.inventory', icon: Package },
  { id: 'cashier', label: 'admin.cashier', icon: Wallet },
  { id: 'customers', label: 'admin.customers', icon: Users },
  { id: 'promo', label: 'admin.promo', icon: Tag },
  { id: 'reports', label: 'admin.reports', icon: FileText },
  { id: 'analytics', label: 'admin.analytics', icon: BarChart3 },
  { id: 'qr', label: 'admin.tables', icon: LayoutGrid },
  { id: 'staff', label: 'admin.staff', icon: CalendarClock },
  { id: 'branches', label: 'admin.branches', icon: Building2 },
  { id: 'settings', label: 'admin.settings', icon: Settings },
] satisfies { id: AdminTab; label: string; icon: typeof LayoutDashboard }[];

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeBranch } = useActiveBranch();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin_sidebar_collapsed') === 'true');
  const userInitials = getInitials(user?.name || user?.email || 'Admin');
  const roleLabel = user?.role ? t(`admin.roles.${user.role}`) : t('admin.roles.admin');
  const restaurantName = activeBranch?.restaurant?.name || t('app.name');
  const brandInitials = getBrandInitials(restaurantName);

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen w-72 flex-col border-r border-border bg-surface-elevated/95 shadow-xl backdrop-blur-md transition-[transform,width] duration-200 lg:sticky lg:translate-x-0 lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed && 'lg:w-20',
      )}
    >
      <div className="border-b border-border p-4">
        <div className={cn('flex items-center gap-3', collapsed && 'lg:flex-col lg:gap-3')}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-sm font-black tracking-tight text-white shadow-sm">
            {brandInitials}
          </div>

          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <h2 className="truncate text-base font-bold leading-tight">{restaurantName}</h2>
            <p className="truncate text-xs font-medium text-foreground-muted">{t('admin.workspace')}</p>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted transition-colors hover:border-primary-500/50 hover:text-foreground lg:flex"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const label = t(tab.label);
          return (
            <NavLink
              key={tab.id}
              to={`/admin/${tab.id}`}
              title={collapsed ? label : undefined}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-0',
                  isActive
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'text-foreground-muted hover:bg-foreground-muted/5 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-primary-500/10' : 'group-hover:bg-surface',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className={cn('min-w-0 truncate', collapsed && 'lg:hidden')}>{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/admin/profile"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              'mb-2 flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 transition-colors hover:border-primary-500/40 hover:bg-primary-500/5',
              collapsed && 'lg:justify-center lg:px-2',
              isActive && 'border-primary-500/30 bg-primary-500/5',
            )
          }
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-sm font-bold text-primary-500">
            {userInitials}
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-sm font-semibold">{user?.name || user?.email || 'Admin'}</p>
            <p className="truncate text-xs font-medium text-foreground-muted">{roleLabel}</p>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? t('common.logout') : undefined}
          className={cn(
            'flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-danger-500 transition-colors hover:bg-danger-500/5',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(collapsed && 'lg:hidden')}>{t('common.logout')}</span>
        </button>
      </div>
    </aside>
  );
}

function getInitials(value: string) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'A';
}

function getBrandInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'FZ';
}
