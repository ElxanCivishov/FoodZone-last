import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, Heart, Plus, Star } from 'lucide-react';
import { useUIStore, useCartStore } from '@/store';
import { allProducts } from '@/data/menuData';
import type { Product } from '@/types';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };
const RECENT = ['sushi', 'ramen', 'nigiri', 'dragon roll'];

export default function SearchScreen() {
  const { setActiveTab, openProductModal, addToast } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(RECENT);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [query]);

  const quickAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    addItem({
      product: p, quantity: 1,
      selectedSize: { id: '8pc', label: '8 pieces', priceModifier: 0 },
      selectedExtras: [], unitPrice: p.price,
    });
    addToast(`${p.name} səbətə əlavə edildi!`, 'success');
  };

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border-light">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('home')}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>

        <div className="flex-1 flex items-center gap-2.5 h-11 px-4 rounded-full bg-surface-elevated border-2 border-primary ring-2 ring-primary-light">
          <Search size={16} className="text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Yemək axtar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => setQuery('')}
              >
                <X size={15} className="text-text-tertiary" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {query.trim() === '' ? (
          /* Recent searches */
          <div className="p-4">
            {suggestions.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-outfit text-[15px] font-bold text-text-primary">Son axtarışlar</h3>
                  <button
                    onClick={() => setSuggestions([])}
                    className="text-primary text-[12px] font-semibold"
                  >
                    Sil
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-full text-[13px] text-text-secondary shadow-xs"
                    >
                      {s}
                      <X
                        size={13}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSuggestions((p) => p.filter((x) => x !== s));
                        }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Categories quick jump */}
            <div className="mt-6">
              <h3 className="font-outfit text-[15px] font-bold text-text-primary mb-3">Kateqoriyalar</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: '🍱', label: 'Sushi', q: 'sushi' },
                  { emoji: '🍜', label: 'Ramen', q: 'ramen' },
                  { emoji: '🐟', label: 'Sashimi', q: 'sashimi' },
                  { emoji: '🍣', label: 'Roll', q: 'rolls' },
                  { emoji: '🍰', label: 'Desert', q: 'desserts' },
                  { emoji: '🍶', label: 'İçki', q: 'drinks' },
                ].map((c) => (
                  <motion.button
                    key={c.q}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuery(c.q)}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border-light shadow-xs text-left"
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-[14px] font-semibold text-text-primary">{c.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search size={52} className="text-text-tertiary mb-4" />
            <p className="text-text-primary text-[16px] font-semibold">Nəticə tapılmadı</p>
            <p className="text-text-secondary text-[13px] mt-1">
              "<span className="font-medium">{query}</span>" üçün nəticə yoxdur
            </p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3">
            {results.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ...SPRING }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openProductModal(p)}
                className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden cursor-pointer"
              >
                <div className="relative aspect-[4/3]">
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  {p.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase">
                      {p.badge}
                    </span>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => toggleLike(e, p.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Heart
                      size={13}
                      className={liked.has(p.id) ? 'text-coral fill-coral' : 'text-text-tertiary'}
                    />
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
                      <span className="text-[10px]">AZN</span> {p.price}
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
          </div>
        )}
      </div>
    </motion.div>
  );
}
