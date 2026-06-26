import { motion } from 'framer-motion';
import { Home, ClipboardList, Gift, MapPin } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const navItems = [
  { id: 'home',           label: 'home.menu',        icon: Home },
  { id: 'my-orders',      label: 'order.trackTitle',  icon: ClipboardList },
  { id: 'rewards',        label: 'rewards.title',     icon: Gift },
  { id: 'order-tracking', label: 'order.tracking',    icon: MapPin },
];

export function BottomNav() {
  const currentScreen = useUIStore((s) => s.currentScreen);
  const setScreen     = useUIStore((s) => s.setScreen);
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50">
      <div className="mx-auto max-w-lg">
        <div className="glass-card rounded-none border-x-0 border-b-0 border-t border-border/50 h-16 flex items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id as any)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 btn-press"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary-500/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-primary-500 stroke-[2.5]' : 'text-foreground-muted',
                    )}
                  />
                </motion.div>

                <span className={cn(
                  'text-[10px] font-medium transition-colors duration-200 relative',
                  isActive ? 'text-primary-500' : 'text-foreground-muted',
                )}>
                  {t(item.label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
