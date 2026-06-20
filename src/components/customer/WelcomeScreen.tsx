import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { UtensilsCrossed, ChevronRight } from 'lucide-react';

export function WelcomeScreen() {
  const session = useSessionStore((s) => s.session);
  const setScreen = useUIStore((s) => s.setScreen);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary-500/10 to-transparent" />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-center z-10 max-w-sm w-full">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30">
          <UtensilsCrossed size={56} className="text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-3">FoodZone</h1>
        <p className="text-dark-300 text-lg mb-2">Welcome!</p>
        {session && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <p className="text-primary-400 font-medium text-lg">Table {session.tableNumber}</p>
            <p className="text-dark-400 text-sm">Sahil Branch</p>
          </motion.div>
        )}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setScreen('home')} className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-4">
          Start Ordering <ChevronRight size={20} />
        </motion.button>
        <div className="mt-8 flex items-center justify-center gap-2 text-dark-500 text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Connected to kitchen
        </div>
      </motion.div>
    </div>
  );
}
