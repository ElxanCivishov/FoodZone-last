import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useUIStore, useCartStore } from '@/store';

const HIDDEN = ['splash', 'checkout', 'tracking', 'login', 'register', 'admin'];

export default function FloatingCart() {
  const { currentScreen, openCartDrawer, floatingCartDismissed, setFloatingCartDismissed } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const total = useCartStore((s) => s.getTotal());
  const prevCountRef = useRef(itemCount);

  // Re-show whenever a new item is added
  useEffect(() => {
    if (itemCount > prevCountRef.current) setFloatingCartDismissed(false);
    prevCountRef.current = itemCount;
  }, [itemCount, setFloatingCartDismissed]);

  const show = !HIDDEN.includes(currentScreen) && itemCount > 0 && !floatingCartDismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute bottom-[80px] left-4 right-4 z-[90] pointer-events-none"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openCartDrawer}
            className="w-full pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-primary-glow text-white"
            style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
          >
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0">
              <span className="font-outfit font-bold text-[14px]">{itemCount}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-[14px] leading-none">Səbəti görüntülə</p>
              <p className="text-white/70 text-[11px] mt-0.5">{itemCount} məhsul</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-outfit font-bold text-[15px]">{total.toFixed(2)} AZN</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight size={14} />
              </div>
            </div>
          </motion.button>

          {/* Close button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setFloatingCartDismissed(true)}
            className="absolute -top-2.5 -right-2.5 pointer-events-auto w-6 h-6 rounded-full bg-[#1a1a2e] border border-white/20 flex items-center justify-center shadow-md"
          >
            <X size={11} className="text-white/80" strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
