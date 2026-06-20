import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { LANGUAGES } from '@/utils/constants';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/utils/cn';

export function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const updateLanguage = useSessionStore((state) => state.updateLanguage);
  const setScreen = useUIStore((state) => state.setScreen);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    updateLanguage(code);
    localStorage.setItem('fz_language', code);
    setScreen('welcome');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold">{t('language.title')}</h1>
          <p className="text-foreground-muted">{t('language.subtitle')}</p>
        </div>

        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                i18n.language === lang.code
                  ? "border-primary-500 bg-primary-500/5"
                  : "border-border bg-surface-elevated hover:border-primary-500/50"
              )}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-medium">{lang.name}</p>
                <p className="text-sm text-foreground-muted">{lang.native}</p>
              </div>
              {i18n.language === lang.code && (
                <Check className="w-5 h-5 text-primary-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
