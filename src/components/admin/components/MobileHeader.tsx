import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, Bell, BellOff, X, Star, Mail, RefreshCw, Zap, MessageSquare, Users, Rocket } from 'lucide-react';
import {
  PanelConnectionBadge,
  PanelControlScroller,
  PanelFullscreenToggle,
  PanelHeaderBrand,
  PanelLanguageSelect,
  PanelRefreshButton,
  PanelThemeToggle,
} from '@/components/common/PanelControls';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useThemeStore } from '@/stores/themeStore';
import { useNotificationsStore, type AdminNotification, type NotificationType } from '@/stores/notificationsStore';
import { cn } from '@/utils/cn';
import { getAdminRouteItem } from '../navigation';

interface MobileHeaderProps {
  sidebarOpen: boolean;
  isConnected: boolean;
  onToggleSidebar: () => void;
}

const TYPE_META: Record<NotificationType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  star:    { icon: Star,          bg: 'bg-warning-500/15',       iconColor: 'text-warning-600' },
  mail:    { icon: Mail,          bg: 'bg-primary-500/10',       iconColor: 'text-primary-500' },
  system:  { icon: RefreshCw,     bg: 'bg-foreground-muted/10',  iconColor: 'text-foreground-muted' },
  social:  { icon: Users,         bg: 'bg-success-500/10',       iconColor: 'text-success-600' },
  message: { icon: MessageSquare, bg: 'bg-purple-500/10',        iconColor: 'text-purple-600' },
  alert:   { icon: Rocket,        bg: 'bg-danger-500/10',        iconColor: 'text-danger-500' },
  promo:   { icon: Zap,           bg: 'bg-pink-500/10',          iconColor: 'text-pink-500' },
};

const AVATAR_COLORS = [
  'bg-primary-500/20 text-primary-600',
  'bg-success-500/20 text-success-600',
  'bg-warning-500/20 text-warning-600',
  'bg-purple-500/20 text-purple-600',
  'bg-pink-500/20 text-pink-600',
];

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);
  if (mins < 1) return 'az əvvəl';
  if (mins < 60) return `${mins} dəqiqə əvvəl`;
  if (hours < 24) return `${hours} saat əvvəl`;
  if (days < 30) return `${days} gün əvvəl`;
  if (years < 1) return `${Math.floor(days / 30)} ay əvvəl`;
  return `${years} il əvvəl`;
}

function DropdownNotificationCard({ notification, onDismiss }: { notification: AdminNotification; onDismiss: (id: string) => void }) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;
  const avatarColor = notification.avatarInitial
    ? AVATAR_COLORS[notification.avatarInitial.charCodeAt(0) % AVATAR_COLORS.length]
    : '';

  if (notification.featured) {
    return (
      <div className="relative rounded-xl bg-primary-700 p-4 flex gap-3 overflow-hidden">
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
          className="absolute top-2.5 right-2.5 p-0.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Bell className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 pr-5">
          <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{notification.title}</p>
          {notification.description && (
            <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2 leading-relaxed">{notification.description}</p>
          )}
          <p className="text-[10px] text-white/40 mt-1.5">{relativeTime(notification.time)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex gap-3 px-4 py-3 hover:bg-foreground-muted/5 transition-colors">
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
        className="absolute top-2.5 right-3 p-0.5 rounded-md hover:bg-foreground-muted/10 transition-colors text-foreground-muted/40 hover:text-foreground-muted"
      >
        <X className="h-3 w-3" />
      </button>
      {notification.avatarInitial ? (
        <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0', avatarColor)}>
          {notification.avatarInitial}
        </div>
      ) : (
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
          <Icon className={cn('h-4 w-4', meta.iconColor)} />
        </div>
      )}
      <div className="min-w-0 pr-5">
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{notification.title}</p>
        {notification.description && (
          <p className="text-[11px] text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">{notification.description}</p>
        )}
        <p className="text-[10px] text-foreground-muted/50 mt-1">{relativeTime(notification.time)}</p>
      </div>
    </div>
  );
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, dismissApi, markAllReadApi, soundEnabled, toggleSound } = useNotificationsStore();
  const navigate = useNavigate();
  const preview = notifications.slice(0, 5);

  const goToAll = () => {
    navigate('/admin/notifications');
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl border border-border bg-surface-elevated shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Bildirişlər</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Səsi söndür' : 'Səsi aç'}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            {soundEnabled
              ? <Bell className="h-3.5 w-3.5 text-primary-500" />
              : <BellOff className="h-3.5 w-3.5" />}
          </button>
          {notifications.length > 0 && (
            <button
              onClick={() => markAllReadApi()}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              hamısını oxundu
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell className="h-8 w-8 text-foreground-muted/30" />
            <p className="text-xs text-foreground-muted">Bildiriş yoxdur</p>
          </div>
        ) : (
          <div className="py-2 space-y-0.5">
            {preview.map((n, i) => (
              <div key={n.id} className={cn(i === 0 && n.featured ? 'px-3 pb-1' : '')}>
                <DropdownNotificationCard notification={n} onDismiss={dismissApi} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={goToAll}
            className="w-full text-center text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            Bütün bildirişlərə bax ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileHeader({ sidebarOpen, isConnected, onToggleSidebar }: MobileHeaderProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';
  const routeItem = getAdminRouteItem(location.pathname);
  const RouteIcon = routeItem.icon;

  const unreadCount = useNotificationsStore((s) => s.unreadCount());

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const refreshAdminData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'by-status'] }),
        queryClient.invalidateQueries({ queryKey: ['waiter-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['tables'] }),
        queryClient.invalidateQueries({ queryKey: ['staff'] }),
        queryClient.invalidateQueries({ queryKey: ['branches'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-surface-elevated/95 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.95)] backdrop-blur-md">
      <div className="px-4 lg:px-7 py-3 flex items-center gap-3">
        <button
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-xl border border-border/70 bg-surface flex items-center justify-center text-foreground-muted hover:border-primary-500/40 hover:text-foreground transition-colors shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        <PanelHeaderBrand
          icon={RouteIcon}
          title={t(routeItem.label)}
          iconWrapClassName="bg-primary-500/10 ring-1 ring-primary-500/20 shadow-[0_14px_32px_-24px_rgba(249,115,22,0.95)]"
          iconClassName="text-primary-500"
        />

        <PanelControlScroller>
          <PanelLanguageSelect value={i18n.language} onChange={(lang) => i18n.changeLanguage(lang)} />
          <PanelThemeToggle
            isDark={isDark}
            onToggle={toggleTheme}
            lightLabel={t('common.lightMode')}
            darkLabel={t('common.darkMode')}
          />
          <PanelFullscreenToggle
            isFullscreen={isFullscreen}
            onToggle={toggleFullscreen}
            enterLabel={t('kitchen.fullscreen')}
            exitLabel={t('kitchen.exitFullscreen')}
          />
          <PanelRefreshButton onRefresh={refreshAdminData} loading={isRefreshing} label={t('kitchen.tooltip.refresh')} />
          <PanelConnectionBadge connected={isConnected} connectedLabel="Live" disconnectedLabel="Offline" />
        </PanelControlScroller>

        {/* Bell icon */}
        <div ref={bellRef} className="relative shrink-0">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className={cn(
              'relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors',
              bellOpen
                ? 'border-primary-500/50 bg-primary-500/10 text-primary-500'
                : 'border-border/70 bg-surface text-foreground-muted hover:border-primary-500/40 hover:text-foreground',
            )}
            aria-label="Bildirişlər"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-primary-500 text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && <NotificationsDropdown onClose={() => setBellOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
