import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { ArrowRight, Utensils, Globe } from 'lucide-react';

export function WelcomeScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const session = useSessionStore((state) => state.session);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary-500/20">
            <Utensils className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('welcome.title')}</h1>
            <p className="text-xl text-primary-500 font-medium mt-1">{t('welcome.subtitle')}</p>
          </div>
          <p className="text-foreground-muted">
            {session?.restaurantName && (
              <span className="block font-medium text-foreground">{session.restaurantName}</span>
            )}
            {session?.branchName && (
              <span className="block text-sm">{session.branchName} — {t('waiter.table')} {session.tableNumber}</span>
            )}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setScreen('home')}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary-500 text-white rounded-2xl font-semibold text-lg hover:bg-primary-600 transition-all active:scale-[0.98]"
          >
            {t('welcome.start')}
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setScreen('language')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-2xl hover:border-primary-500 transition-colors text-sm"
          >
            <Globe className="w-4 h-4" />
            {t('welcome.changeLang')}
          </button>
        </div>
      </div>
    </div>
  );
}
