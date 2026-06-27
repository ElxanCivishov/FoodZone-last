import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag } from 'lucide-react';
import { useUIStore, useCartStore } from '@/store';

const HIDDEN = ['splash', 'tracking', 'login', 'register', 'checkout', 'admin', 'orderSuccess'];
const CART_HIDDEN = ['splash', 'checkout', 'tracking', 'login', 'register', 'admin'];

export default function WaiterCallFAB() {
  const { currentScreen, openModal, openCartDrawer, floatingCartDismissed } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());

  if (HIDDEN.includes(currentScreen)) return null;

  const showCartFAB =
    !CART_HIDDEN.includes(currentScreen) &&
    itemCount > 0 &&
    floatingCartDismissed;

  return (
    <div className="absolute bottom-[88px] left-4 z-[95] flex flex-col-reverse items-center gap-2">
      {/* Waiter call button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.2 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => openModal('waiterCall')}
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_6px_24px_rgba(0,194,232,0.35)] relative"
        style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
      >
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-2xl"
          style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
        />
        <Bell size={20} className="text-white relative z-10" strokeWidth={2.2} />
      </motion.button>

      {/* Cart FAB — only when FloatingCart is dismissed */}
      <AnimatePresence>
        {showCartFAB && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            whileTap={{ scale: 0.88 }}
            onClick={openCartDrawer}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_6px_24px_rgba(0,194,232,0.35)] relative"
            style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
          >
            <ShoppingBag size={20} className="text-white relative z-10" strokeWidth={2.2} />
            {/* Item count badge */}
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-primary z-20">
              {itemCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
