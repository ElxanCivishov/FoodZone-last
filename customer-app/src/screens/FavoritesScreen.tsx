import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, Plus, Star } from 'lucide-react';
import { useUIStore, useCartStore } from '@/store';
import { allProducts } from '@/data/menuData';
import type { Product } from '@/types';
import { useT } from '@/hooks/useT';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const INITIAL_LIKES = new Set([1, 3, 7]);

export default function FavoritesScreen() {
  const t = useT();
  const { goBack, openProductModal, addToast } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const [liked, setLiked] = useState<Set<number>>(INITIAL_LIKES);

  const favorites = allProducts.filter((p) => liked.has(p.id));

  const unlike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const quickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    addItem({
      product: p, quantity: 1,
      selectedSize: { id: '8pc', label: '8 pieces', priceModifier: 0 },
      selectedExtras: [], unitPrice: p.price,
    });
    addToast(`${p.name} ${t.cart.added}`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-border-light">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <div>
          <h1 className="font-outfit text-[18px] font-bold text-text-primary">{t.favoritesScreen.title}</h1>
          <p className="text-[12px] text-text-secondary">{favorites.length} {t.common.item}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-coral/10 flex items-center justify-center mb-4">
              <Heart size={36} className="text-coral" />
            </div>
            <p className="font-outfit text-[17px] font-bold text-text-primary">{t.favoritesScreen.empty}</p>
            <p className="text-text-secondary text-[13px] mt-1">
              {t.favoritesScreen.emptyNote}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {favorites.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05, ...SPRING }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openProductModal(p)}
                  className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden cursor-pointer"
                >
                  <div className="relative aspect-[4/3]">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => unlike(e, p.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Heart size={14} className="text-coral fill-coral" />
                    </motion.button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-semibold text-text-primary truncate">{p.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="text-warning fill-warning" />
                      <span className="text-[11px] text-text-secondary">{p.rating}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-primary font-outfit text-[14px] font-bold">
                        <span className="text-[10px]">{t.common.currency}</span> {p.price}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => quickAdd(e, p)}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-primary-glow"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
