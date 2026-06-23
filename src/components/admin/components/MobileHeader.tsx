import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { LayoutDashboard, Menu } from 'lucide-react';
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

interface MobileHeaderProps {
  sidebarOpen: boolean;
  isConnected: boolean;
  onToggleSidebar: () => void;
}

export function MobileHeader({ sidebarOpen, isConnected, onToggleSidebar }: MobileHeaderProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { activeBranch } = useActiveBranch();
  const restaurantName = activeBranch?.restaurant?.name || t('app.name');
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDark = resolvedTheme === 'dark';

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
    <header className="sticky top-0 z-20 border-b border-border bg-surface-elevated/95 backdrop-blur-md">
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3 overflow-hidden">
        <button
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        <PanelHeaderBrand
          icon={LayoutDashboard}
          title={`${restaurantName} Admin`}
          subtitle={t('admin.dashboard')}
          iconWrapClassName="bg-primary-500/10"
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
      </div>
    </header>
  );
}
