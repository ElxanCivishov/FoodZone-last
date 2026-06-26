import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ArrowRight, Utensils, Globe, Download } from 'lucide-react';

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
};

export function WelcomeScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((s) => s.setScreen);
  const session   = useSessionStore((s) => s.session);
  const { canInstall, promptInstall } = usePWAInstall();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Arxa fon gradient blob-lar */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500 blur-[80px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-400 blur-[80px]"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm space-y-8 text-center relative z-10"
      >
        {/* Logo */}
        <motion.div variants={item}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mx-auto shadow-glow"
          >
            <Utensils className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>

        {/* Başlıq */}
        <motion.div variants={item} className="space-y-2">
          <h1 className="text-3xl font-bold">{t('welcome.title')}</h1>
          <p className="text-xl gradient-text font-semibold">{t('welcome.subtitle')}</p>
          <div className="text-foreground-muted">
            {session?.restaurantName && (
              <span className="block font-semibold text-foreground">{session.restaurantName}</span>
            )}
            {session?.branchName && (
              <span className="block text-sm">{session.branchName} — {t('waiter.table')} {session.tableNumber}</span>
            )}
          </div>
        </motion.div>

        {/* Düymələr */}
        <motion.div variants={item} className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('home')}
            className="w-full flex items-center justify-center gap-2 py-4 btn-primary rounded-2xl text-lg"
          >
            {t('welcome.start')}
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('language')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-2xl hover:border-primary-500 transition-colors text-sm btn-press"
          >
            <Globe className="w-4 h-4" />
            {t('welcome.changeLang')}
          </motion.button>

          {canInstall && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary-500/40 rounded-2xl text-sm text-primary-500 hover:bg-primary-500/5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Tətbiqi qur (Offline istifadə üçün)
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
