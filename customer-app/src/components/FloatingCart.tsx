import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useUIStore, useCartStore } from '@/store';

const HIDDEN = ['splash', 'checkout', 'tracking', 'login', 'register', 'admin'];

export default function FloatingCart() {
  const { currentScreen, openCartDrawer } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const total = useCartStore((s) => s.getTotal());

  const show = !HIDDEN.includes(currentScreen) && itemCount > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          whileTap={{ scale: 0.96 }}
          onClick={openCartDrawer}
          className="absolute bottom-[80px] left-4 right-4 z-[90] flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-primary-glow text-white"
          style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
        >
          {/* Count badge */}
          <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0">
            <span className="font-outfit font-bold text-[14px]">{itemCount}</span>
          </div>

          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-[14px] leading-none">Səbəti görüntülə</p>
            <p className="text-white/70 text-[11px] mt-0.5">{itemCount} məhsul</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-outfit font-bold text-[15px]">{total.toFixed(2)} AZN</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight size={14} />
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
