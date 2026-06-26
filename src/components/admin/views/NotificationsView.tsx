import { useEffect, useState } from 'react';
import {
  Bell, X, Star, Mail, RefreshCw, Zap,
  MessageSquare, Users, CheckCheck, Rocket, Settings2,
  ShoppingCart, CreditCard, XCircle, Clock, Package,
  MonitorOff, Volume2, UtensilsCrossed, Headphones,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { SectionTitle } from '../components/SectionTitle';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useActiveBranch } from '../hooks/useActiveBranch';
import {
  useNotificationsStore,
  type AdminNotification,
  type NotificationType,
  type NotificationPreferences,
} from '@/stores/notificationsStore';

const TYPE_META: Record<NotificationType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  star: { icon: Star, bg: 'bg-warning-500/15', iconColor: 'text-warning-600' },
  mail: { icon: Mail, bg: 'bg-primary-500/10', iconColor: 'text-primary-500' },
  system: { icon: RefreshCw, bg: 'bg-foreground-muted/10', iconColor: 'text-foreground-muted' },
  social: { icon: Users, bg: 'bg-success-500/10', iconColor: 'text-success-600' },
  message: { icon: MessageSquare, bg: 'bg-purple-500/10', iconColor: 'text-purple-600' },
  alert: { icon: Rocket, bg: 'bg-danger-500/10', iconColor: 'text-danger-500' },
  promo: { icon: Zap, bg: 'bg-pink-500/10', iconColor: 'text-pink-500' },
};

const AVATAR_COLORS = [
  'bg-primary-500/20 text-primary-600',
  'bg-success-500/20 text-success-600',
  'bg-warning-500/20 text-warning-600',
  'bg-purple-500/20 text-purple-600',
  'bg-pink-500/20 text-pink-600',
];

export function relativeTime(date: Date): string {
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

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: AdminNotification;
  onDismiss: (id: string) => void;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  if (notification.featured) {
    return (
      <div className="relative rounded-2xl bg-primary-700 p-5 flex flex-col gap-3 shadow-lg overflow-hidden min-h-[120px]">
        <button
          onClick={() => onDismiss(notification.id)}
          className="absolute top-3 right-3 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{notification.title}</p>
            {notification.description && (
              <p className="text-xs text-white/70 mt-1 leading-relaxed line-clamp-2">{notification.description}</p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-white/50 mt-auto">{relativeTime(notification.time)}</p>
      </div>
    );
  }

  const avatarColor = notification.avatarInitial
    ? AVATAR_COLORS[(notification.avatarInitial.charCodeAt(0)) % AVATAR_COLORS.length]
    : '';

  return (
    <div className={cn(
      'relative rounded-2xl border border-border bg-surface-elevated p-4 flex flex-col gap-2 min-h-[100px]',
      !notification.read && 'ring-1 ring-primary-500/20',
    )}>
      <button
        onClick={() => onDismiss(notification.id)}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-foreground-muted/10 transition-colors text-foreground-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        {notification.avatarInitial ? (
          <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0', avatarColor)}>
            {notification.avatarInitial}
          </div>
        ) : (
          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
            <Icon className={cn('h-4 w-4', meta.iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{notification.title}</p>
          {notification.description && (
            <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed line-clamp-2">{notification.description}</p>
          )}
        </div>
      </div>
      <p className="text-[11px] text-foreground-muted/60 mt-auto">{relativeTime(notification.time)}</p>
    </div>
  );
}

// ─── Settings panel ──────────────────────────────────────────────────────────

type PrefItem = {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

const PREF_GROUPS: { title: string; items: PrefItem[] }[] = [
  {
    title: 'Səs',
    items: [
      {
        key: 'sound',
        label: 'Bildiriş səsi',
        description: 'Yeni bildiriş gəldikdə səs çalsın',
        icon: Volume2,
        iconBg: 'bg-primary-500/10',
        iconColor: 'text-primary-500',
      },
    ],
  },
  {
    title: 'Sifariş bildirişləri',
    items: [
      {
        key: 'new_order',
        label: 'Mətbəx panelindən yeni sifariş',
        description: 'Yeni sifariş gəldikdə admin panelə bildiriş göndər',
        icon: ShoppingCart,
        iconBg: 'bg-success-500/10',
        iconColor: 'text-success-600',
      },
      {
        key: 'payment_received',
        label: 'Ödəniş qəbul edildi',
        description: 'Sifariş ödənildikdə bildiriş al',
        icon: CreditCard,
        iconBg: 'bg-warning-500/10',
        iconColor: 'text-warning-600',
      },
      {
        key: 'order_cancelled',
        label: 'Sifariş ləğv edildi',
        description: 'Sifariş ləğv edildikdə bildiriş al',
        icon: XCircle,
        iconBg: 'bg-danger-500/10',
        iconColor: 'text-danger-500',
      },
      {
        key: 'sla_breach',
        label: 'Gecikən sifariş (SLA)',
        description: 'Sifariş gözləmə müddəti aşıldıqda xəbərdarlıq al',
        icon: Clock,
        iconBg: 'bg-orange-500/10',
        iconColor: 'text-orange-500',
      },
    ],
  },
  {
    title: 'Stok & İnventar',
    items: [
      {
        key: 'low_stock',
        label: 'Stok azalması',
        description: 'Məhsul kritik səviyyəyə düşdükdə bildiriş al',
        icon: Package,
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-600',
      },
    ],
  },
  {
    title: 'Sistem',
    items: [
      {
        key: 'system',
        label: 'Sistem bildirişləri',
        description: 'Server, yeniləmə və digər sistem mesajları',
        icon: MonitorOff,
        iconBg: 'bg-foreground-muted/10',
        iconColor: 'text-foreground-muted',
      },
    ],
  },
  {
    title: 'Ofisiant paneli',
    items: [
      {
        key: 'waiter_new_request',
        label: 'Yeni ofisiant çağırışı',
        description: 'Masadan çağırış gəldikdə bildiriş al (su, hesab, təmizlik...)',
        icon: Bell,
        iconBg: 'bg-primary-500/10',
        iconColor: 'text-primary-500',
      },
      {
        key: 'waiter_order_ready',
        label: 'Sifariş hazırdır',
        description: 'Mətbəxdən sifariş hazır olduqda bildiriş al',
        icon: UtensilsCrossed,
        iconBg: 'bg-success-500/10',
        iconColor: 'text-success-600',
      },
      {
        key: 'waiter_sound',
        label: 'Ofisiant paneli səsi',
        description: 'Ofisiant paneli bildirişləri üçün ayrıca səs',
        icon: Headphones,
        iconBg: 'bg-warning-500/10',
        iconColor: 'text-warning-600',
      },
    ],
  },
];

function NotificationSettings() {
  const { prefs, setPref } = useNotificationsStore();
  const allEnabled = Object.values(prefs).every(Boolean);

  const toggleAll = () => {
    const next = !allEnabled;
    (Object.keys(prefs) as (keyof NotificationPreferences)[]).forEach((k) => setPref(k, next));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground-muted">
          Bu parametrlər yalnız sizin cihazınızda saxlanılır.
        </p>
        <button
          onClick={toggleAll}
          className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
        >
          {allEnabled ? 'Hamısını söndür' : 'Hamısını aç'}
        </button>
      </div>

      {PREF_GROUPS.map((group) => (
        <div key={group.title} className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-foreground-muted/5">
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{group.title}</p>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', item.iconBg)}>
                      <Icon className={cn('h-4 w-4', item.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={!!prefs[item.key]}
                    onChange={(v) => setPref(item.key, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type ActiveTab = 'list' | 'settings';

export function NotificationsView() {
  const [tab, setTab] = useState<ActiveTab>('list');
  const {
    notifications, dismissApi, markAllReadApi, addExample,
    unreadCount, loadFromApi, apiLoaded,
  } = useNotificationsStore();
  const { activeBranch } = useActiveBranch();
  const count = unreadCount();

  useEffect(() => {
    loadFromApi(activeBranch?.id);
  }, [activeBranch?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionTitle
          title="Bildirişlər"
          subtitle={tab === 'list' ? 'Bütün bildirişlərin siyahısı' : 'Bildiriş parametrləri'}
        />
        {tab === 'list' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={addExample}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-surface text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Bell className="h-4 w-4" />
              Nümunə
            </button>
            <button
              onClick={() => markAllReadApi(activeBranch?.id)}
              disabled={notifications.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Hamısını oxundu
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1 w-fit">
        {([
          { id: 'list' as ActiveTab, label: 'Bildirişlər', icon: Bell, badge: count },
          { id: 'settings' as ActiveTab, label: 'Parametrlər', icon: Settings2, badge: 0 },
        ]).map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === id ? 'bg-primary-500 text-white' : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold',
                tab === id ? 'bg-white/20 text-white' : 'bg-primary-500 text-white',
              )}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Settings tab */}
      {tab === 'settings' && <NotificationSettings />}

      {/* List tab */}
      {tab === 'list' && (
        !apiLoaded ? (
          <div className="flex items-center justify-center py-24 text-sm text-foreground-muted">
            Yüklənir...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border bg-surface-elevated/50">
            <Bell className="h-12 w-12 text-foreground-muted/30 mb-4" />
            <p className="text-base font-medium text-foreground-muted">Bildiriş yoxdur</p>
            <p className="text-sm text-foreground-muted/60 mt-1">Yeni bildirişlər burada görünəcək</p>
            <button
              onClick={addExample}
              className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <Bell className="h-4 w-4" />
              Nümunə bildiriş əlavə et
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onDismiss={dismissApi} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
