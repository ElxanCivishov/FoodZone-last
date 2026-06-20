import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-1 rounded-lg bg-surface-elevated border border-border p-1", className)}>
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          resolvedTheme === 'light' ? "bg-primary-500 text-white" : "text-foreground-muted hover:text-foreground"
        )}
        title={t('common.lightMode')}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          resolvedTheme === 'dark' ? "bg-primary-500 text-white" : "text-foreground-muted hover:text-foreground"
        )}
        title={t('common.darkMode')}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === 'system' ? "bg-primary-500 text-white" : "text-foreground-muted hover:text-foreground"
        )}
        title={t('common.system')}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
