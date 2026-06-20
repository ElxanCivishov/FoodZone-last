import { Home, ClipboardList, Gift, MapPin } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const navItems = [
  { id: 'home', label: 'home.menu', icon: Home },
  { id: 'my-orders', label: 'order.trackTitle', icon: ClipboardList },
  { id: 'rewards', label: 'rewards.title', icon: Gift },
  { id: 'order-tracking', label: 'order.tracking', icon: MapPin },
];

export function BottomNav() {
  const currentScreen = useUIStore((state) => state.currentScreen);
  const setScreen = useUIStore((state) => state.setScreen);
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-border safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 transition-colors",
                isActive ? "text-primary-500" : "text-foreground-muted"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{t(item.label)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
