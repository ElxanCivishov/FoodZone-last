import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useUIStore } from '@/store';

const HIDDEN = ['splash', 'tracking', 'login', 'register', 'checkout', 'admin', 'orderSuccess'];

export default function WaiterCallFAB() {
  const { currentScreen, openModal } = useUIStore();

  if (HIDDEN.includes(currentScreen)) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.2 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => openModal('waiterCall')}
        className="absolute bottom-[88px] left-4 z-[90] w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_6px_24px_rgba(0,194,232,0.35)]"
        style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
      >
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-2xl"
          style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
        />
        <Bell size={20} className="text-white relative z-10" strokeWidth={2.2} />
      </motion.button>
    </AnimatePresence>
  );
}
