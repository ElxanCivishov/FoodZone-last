import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/utils/constants';
import { Globe, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border border-border text-sm hover:border-primary-500 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGES.find((l) => l.code === i18n.language)?.flag || '🌐'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  localStorage.setItem('fz_language', lang.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-primary-500/10 transition-colors",
                  i18n.language === lang.code ? "text-primary-500 font-medium" : "text-foreground"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.native}</span>
                {i18n.language === lang.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
