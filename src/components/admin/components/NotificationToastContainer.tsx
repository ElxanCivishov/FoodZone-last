import { useEffect, useRef, useState } from 'react';
import { X, Star, Mail, RefreshCw, Zap, MessageSquare, Users, Rocket, Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useNotificationsStore, type ToastNotification, type NotificationType } from '@/stores/notificationsStore';

const TOAST_DURATION_MS = 5000;

const TYPE_META: Record<NotificationType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  star:    { icon: Star,          bg: 'bg-warning-500/15',      iconColor: 'text-warning-600' },
  mail:    { icon: Mail,          bg: 'bg-primary-500/10',      iconColor: 'text-primary-500' },
  system:  { icon: RefreshCw,     bg: 'bg-foreground-muted/10', iconColor: 'text-foreground-muted' },
  social:  { icon: Users,         bg: 'bg-success-500/10',      iconColor: 'text-success-600' },
  message: { icon: MessageSquare, bg: 'bg-purple-500/10',       iconColor: 'text-purple-600' },
  alert:   { icon: Rocket,        bg: 'bg-danger-500/10',       iconColor: 'text-danger-500' },
  promo:   { icon: Zap,           bg: 'bg-pink-500/10',         iconColor: 'text-pink-500' },
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az əvvəl';
  if (mins < 60) return `${mins} dəqiqə əvvəl`;
  return `${Math.floor(mins / 60)} saat əvvəl`;
}

function ToastItem({ toast, onDismiss }: { toast: ToastNotification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Enter animation
    const raf = requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss with exit animation
    timerRef.current = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDismiss, 300);
    }, TOAST_DURATION_MS - 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(onDismiss, 300);
  };

  const meta = TYPE_META[toast.type];
  const Icon = toast.featured ? Bell : meta.icon;
  const iconBg = toast.featured ? 'bg-primary-700' : meta.bg;
  const iconColor = toast.featured ? 'text-white' : meta.iconColor;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 w-[320px] rounded-2xl border border-border bg-surface-elevated shadow-xl px-4 py-3.5',
        'transition-all duration-300 ease-out',
        visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
      )}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
        <div
          className="h-full bg-primary-500/40 origin-left"
          style={{ animation: `shrink ${TOAST_DURATION_MS}ms linear forwards` }}
        />
      </div>

      {/* Icon */}
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1 leading-relaxed">
            {toast.description}
          </p>
        )}
        <p className="text-[10px] text-foreground-muted/50 mt-1">{relativeTime(toast.time)}</p>
      </div>

      {/* Close */}
      <button
        onClick={handleClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-foreground-muted/10 transition-colors text-foreground-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NotificationToastContainer() {
  const { toasts, dismissToast } = useNotificationsStore();

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.toastId} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismissToast(t.toastId)} />
          </div>
        ))}
      </div>
    </>
  );
}
