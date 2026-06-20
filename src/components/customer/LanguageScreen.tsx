import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '@/utils/constants';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';

export function LanguageScreen() {
  const updateLanguage = useSessionStore((s) => s.updateLanguage);
  const setScreen = useUIStore((s) => s.setScreen);

  const handleSelect = (code: string) => {
    updateLanguage(code);
    setScreen('welcome');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Globe size={32} className="text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Select Language</h2>
        <p className="text-dark-400 mb-8">Choose your preferred language</p>
        <div className="space-y-3">
          {LANGUAGES.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center gap-4 p-4 bg-dark-800 border border-dark-700 rounded-xl hover:border-primary-500/50 transition-colors text-left"
            >
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <p className="text-white font-medium">{lang.name}</p>
                <p className="text-dark-400 text-sm">{lang.native}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
