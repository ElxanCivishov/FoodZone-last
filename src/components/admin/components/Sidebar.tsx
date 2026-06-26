import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Info,
  LogOut,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { adminNavSections } from '../navigation';
import { useActiveBranch } from '../hooks/useActiveBranch';

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeBranch } = useActiveBranch();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('admin_sidebar_collapsed') === 'true',
  );
  const userInitials = getInitials(user?.name || user?.email || 'Admin');
  const roleLabel = user?.role ? t(`admin.roles.${user.role}`) : t('admin.roles.admin');
  const restaurantName = activeBranch?.restaurant?.name || t('app.name');
  const branchName = activeBranch?.name || t('admin.sidebar.mainBranch');
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
    <motion.aside
      animate={{ width: collapsed ? 80 : 288 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border/60 bg-surface-elevated/95 shadow-2xl shadow-black/20 backdrop-blur-md lg:sticky lg:z-40 lg:-mr-px lg:translate-x-0 lg:shadow-[18px_0_42px_-34px_rgba(15,23,42,0.95)]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -right-6 hidden w-6 bg-gradient-to-r from-black/10 to-transparent opacity-80 lg:block dark:from-black/35"
      />
      <div className="p-3 pb-2">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border border-border/50 bg-surface/80 p-3 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.9)] ring-1 ring-white/5',
            collapsed && 'lg:flex-col lg:p-2',
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-sm font-black tracking-tight text-white shadow-sm">
            {brandInitials}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <h2 className="truncate text-base font-bold leading-tight">{restaurantName}</h2>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <span className="max-w-full truncate rounded-full border border-border/60 bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-foreground-muted">
                    {branchName}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface-elevated text-foreground-muted shadow-sm transition-colors hover:border-primary-500/40 hover:text-foreground lg:flex"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {adminNavSections.map((section) => (
          <div key={section.id} className="mb-4 last:mb-0">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  key={`section-${section.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-muted/70"
                >
                  {t(section.label)}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {section.items.map((tab) => {
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
                        'group relative flex h-11 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium transition-colors',
                        collapsed && 'lg:justify-center lg:px-0',
                        isActive
                          ? 'border-primary-500/25 bg-primary-500/10 text-primary-500 shadow-sm before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary-500'
                          : 'text-foreground-muted hover:border-border/60 hover:bg-foreground-muted/5 hover:text-foreground',
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
                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              key={`label-${tab.id}`}
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15 }}
                              className="min-w-0 truncate overflow-hidden"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/50 p-3 shadow-[0_-16px_30px_-32px_rgba(15,23,42,0.85)]">
        <UserMenu
          collapsed={collapsed}
          email={user?.email || 'admin@foodzone.local'}
          initials={userInitials}
          name={user?.name || user?.email || 'Admin'}
          role={roleLabel}
          onLogout={handleLogout}
          onSettings={() => {
            setSidebarOpen(false);
            navigate('/admin/settings');
          }}
          t={t}
        />
      </div>
    </motion.aside>
  );
}

function UserMenu({
  collapsed,
  email,
  initials,
  name,
  role,
  onLogout,
  onSettings,
  t,
}: {
  collapsed: boolean;
  email: string;
  initials: string;
  name: string;
  role: string;
  onLogout: () => void;
  onSettings: () => void;
  t: (key: string) => string;
}) {
  return (
    <Menu>
      {({ open }) => (
        <div className="relative">
          <MenuButton
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-surface p-2.5 text-left shadow-sm transition-colors hover:border-primary-500/40 hover:bg-primary-500/5 focus:outline-none',
              collapsed && 'lg:justify-center lg:p-2',
              open && 'border-primary-500/30 bg-primary-500/5',
            )}
          >
            <UserAvatar initials={initials} />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="truncate text-xs font-medium text-foreground-muted">{email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="user-chevron"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1 text-foreground-muted"
              >
              <RoleInfoTooltip role={role} />
              <ChevronUp className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
              </motion.div>
            )}
            </AnimatePresence>
          </MenuButton>

          <MenuItems
            anchor="top start"
            className="z-[9999] w-64 rounded-xl border border-border/70 bg-surface-elevated p-1.5 shadow-2xl focus:outline-none"
          >
            <UserMenuAction icon={Settings} label={t('admin.sidebar.userMenu.account')} onClick={onSettings} />
            <UserMenuAction danger icon={LogOut} label={t('admin.sidebar.userMenu.signOut')} onClick={onLogout} />
          </MenuItems>
        </div>
      )}
    </Menu>
  );
}

function RoleInfoTooltip({ role }: { role: string }) {
  return (
    <span
      aria-label={role}
      title={role}
      className="group/role relative inline-flex h-5 w-5 items-center justify-center"
    >
      <Info className="h-4 w-4 transition-colors group-hover/role:text-foreground" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border/70 bg-surface-elevated px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-xl group-hover/role:block">
        {role}
        <span className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border/70 bg-surface-elevated" />
      </span>
    </span>
  );
}

function UserMenuAction({
  icon: Icon,
  label,
  danger,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <MenuItem disabled={disabled}>
      {({ focus }) => (
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
            danger ? 'text-danger-500' : 'text-foreground',
            disabled && 'cursor-not-allowed opacity-45',
            focus && !disabled && (danger ? 'bg-danger-500/10' : 'bg-foreground-muted/10'),
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      )}
    </MenuItem>
  );
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-sm font-bold text-primary-500 ring-1 ring-primary-500/20">
      {initials}
    </div>
  );
}

function getInitials(value: string) {
  return (
    value
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A'
  );
}

function getBrandInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'FZ';
}
