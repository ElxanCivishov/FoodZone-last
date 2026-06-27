import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Images } from 'lucide-react';
import { useUIStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

type GalCat = 'all' | 'food' | 'atmosphere' | 'kitchen' | 'drinks';

const CATS: { id: GalCat; label: string; emoji: string }[] = [
  { id: 'all',        label: 'Hamısı',    emoji: '🖼️' },
  { id: 'food',       label: 'Yemək',     emoji: '🍣' },
  { id: 'atmosphere', label: 'Atmosfer',  emoji: '✨' },
  { id: 'kitchen',    label: 'Mətbəx',    emoji: '👨‍🍳' },
  { id: 'drinks',     label: 'İçkilər',   emoji: '🍵' },
];

interface GalleryItem {
  id: number;
  cat: GalCat;
  title: string;
  sub: string;
  grad: string;
  emoji: string;
  tall: boolean;
}

const ITEMS: GalleryItem[] = [
  { id: 1,  cat: 'food',       title: 'Dragon Roll',       sub: 'Xüsusi sushi',      grad: 'linear-gradient(135deg,#f093fb,#f5576c)',  emoji: '🍣',  tall: true  },
  { id: 2,  cat: 'atmosphere', title: 'Giriş',             sub: 'Restoran cəphəsi',  grad: 'linear-gradient(135deg,#667eea,#764ba2)',  emoji: '🏮',  tall: false },
  { id: 3,  cat: 'food',       title: 'Sashimi Seçimi',    sub: '12 parça',          grad: 'linear-gradient(135deg,#4facfe,#00f2fe)',  emoji: '🐟',  tall: false },
  { id: 4,  cat: 'kitchen',    title: 'Açıq Mətbəx',       sub: 'Peşəkar komanda',   grad: 'linear-gradient(135deg,#43e97b,#38f9d7)',  emoji: '👨‍🍳', tall: true  },
  { id: 5,  cat: 'food',       title: 'Ramen',             sub: 'Tonkotsu',          grad: 'linear-gradient(135deg,#fa709a,#fee140)',  emoji: '🍜',  tall: false },
  { id: 6,  cat: 'atmosphere', title: 'VIP Zal',           sub: 'Xüsusi tədbir',     grad: 'linear-gradient(135deg,#30cfd0,#667eea)',  emoji: '✨',  tall: true  },
  { id: 7,  cat: 'drinks',     title: 'Sake Koleksiyası',  sub: 'İdxal',             grad: 'linear-gradient(135deg,#ffecd2,#fcb69f)',  emoji: '🍶',  tall: false },
  { id: 8,  cat: 'food',       title: 'Nigiri Set',        sub: '8 parça',           grad: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',  emoji: '🍱',  tall: true  },
  { id: 9,  cat: 'kitchen',    title: 'Hazırlıq Prosesi',  sub: 'Hər gün səhər',     grad: 'linear-gradient(135deg,#f7971e,#ffd200)',  emoji: '🔪',  tall: false },
  { id: 10, cat: 'atmosphere', title: 'Terras',            sub: 'Açıq hava',         grad: 'linear-gradient(135deg,#11998e,#38ef7d)',  emoji: '🌿',  tall: false },
  { id: 11, cat: 'drinks',     title: 'Matcha Çayı',       sub: 'Ənənəvi üsul',      grad: 'linear-gradient(135deg,#56ab2f,#a8e063)',  emoji: '🍵',  tall: true  },
  { id: 12, cat: 'food',       title: 'Tempura',           sub: 'Taze sebzə',        grad: 'linear-gradient(135deg,#ff9a9e,#fecfef)',  emoji: '🦐',  tall: false },
  { id: 13, cat: 'atmosphere', title: 'Şam Yeməyi',        sub: 'Romantik atmosfer', grad: 'linear-gradient(135deg,#2d3561,#c05c7e)',  emoji: '🕯️',  tall: false },
  { id: 14, cat: 'drinks',     title: 'Umeshu',            sub: 'Gavalı likyoru',    grad: 'linear-gradient(135deg,#ee9ca7,#ffdde1)',  emoji: '🫙',  tall: true  },
  { id: 15, cat: 'kitchen',    title: 'Sushi Master',      sub: '20 il təcrübə',     grad: 'linear-gradient(135deg,#1a1a2e,#16213e)',  emoji: '🥢',  tall: false },
  { id: 16, cat: 'food',       title: 'Mochi Deserti',     sub: 'Günün şirniyi',     grad: 'linear-gradient(135deg,#e0c3fc,#8ec5fc)',  emoji: '🍡',  tall: true  },
];

export default function GalleryScreen() {
  const { goBack } = useUIStore();
  const [activeCat, setActiveCat] = useState<GalCat>('all');
  const [lightbox, setLightbox] = useState<{ item: GalleryItem; idx: number } | null>(null);

  const filtered = useMemo(
    () => activeCat === 'all' ? ITEMS : ITEMS.filter(i => i.cat === activeCat),
    [activeCat],
  );

  const leftCol  = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 === 1);

  const openLightbox = (item: GalleryItem) => {
    const idx = filtered.findIndex(i => i.id === item.id);
    setLightbox({ item, idx });
  };

  const navigate = (dir: 1 | -1) => {
    if (!lightbox) return;
    const next = (lightbox.idx + dir + filtered.length) % filtered.length;
    setLightbox({ item: filtered[next], idx: next });
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
      <div className="bg-white px-4 pt-12 pb-3 border-b border-border-light flex items-center gap-3 shrink-0">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={goBack}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">Qalereya</h1>
          <p className="text-text-secondary text-[12px]">{filtered.length} şəkil</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
          <Images size={16} className="text-primary" />
        </div>
      </div>

      {/* Category filter */}
      <div className="bg-white shrink-0 px-4 py-3 border-b border-border-light">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATS.map((cat) => {
            const active = activeCat === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setActiveCat(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-primary text-white shadow-primary-glow'
                    : 'bg-surface-elevated text-text-secondary'
                }`}
              >
                <span className="text-[13px]">{cat.emoji}</span>
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3"
          >
            {/* Left column */}
            <div className="flex-1 flex flex-col gap-3">
              {leftCol.map((item, i) => (
                <GalleryCard key={item.id} item={item} index={i * 2} onPress={openLightbox} />
              ))}
            </div>
            {/* Right column */}
            <div className="flex-1 flex flex-col gap-3 mt-6">
              {rightCol.map((item, i) => (
                <GalleryCard key={item.id} item={item} index={i * 2 + 1} onPress={openLightbox} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            item={lightbox.item}
            total={filtered.length}
            idx={lightbox.idx}
            onClose={() => setLightbox(null)}
            onNavigate={navigate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Gallery card ─── */
function GalleryCard({
  item, index, onPress,
}: { item: GalleryItem; index: number; onPress: (i: GalleryItem) => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ...SPRING }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onPress(item)}
      className="w-full rounded-2xl overflow-hidden relative group text-left"
      style={{ height: item.tall ? 220 : 150 }}
    >
      {/* Gradient bg */}
      <div className="absolute inset-0" style={{ background: item.grad }} />

      {/* Emoji */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl drop-shadow-lg select-none">{item.emoji}</span>
      </div>

      {/* Bottom overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 py-2.5"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
      >
        <p className="text-white text-[12px] font-bold leading-tight">{item.title}</p>
        <p className="text-white/70 text-[10px] mt-0.5">{item.sub}</p>
      </div>

      {/* Category badge */}
      <div className="absolute top-2 right-2">
        <span className="text-[9px] font-bold bg-black/30 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
          {CATS.find(c => c.id === item.cat)?.label}
        </span>
      </div>
    </motion.button>
  );
}

/* ─── Lightbox ─── */
function Lightbox({
  item, total, idx, onClose, onNavigate,
}: {
  item: GalleryItem;
  total: number;
  idx: number;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-0 z-[400] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 shrink-0">
        <div>
          <p className="text-white font-bold text-[16px]">{item.title}</p>
          <p className="text-white/50 text-[12px] mt-0.5">{item.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-[13px] font-medium">{idx + 1}/{total}</span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X size={18} className="text-white" />
          </motion.button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={SPRING}
            className="w-full rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
            style={{ height: 340, background: item.grad }}
          >
            <span className="text-9xl drop-shadow-2xl select-none">{item.emoji}</span>
          </motion.div>
        </AnimatePresence>

        {/* Prev */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onNavigate(-1)}
          className="absolute left-0 w-12 h-12 flex items-center justify-center"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </div>
        </motion.button>

        {/* Next */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onNavigate(1)}
          className="absolute right-0 w-12 h-12 flex items-center justify-center"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <ChevronRight size={20} className="text-white" />
          </div>
        </motion.button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-6 shrink-0">
        {Array.from({ length: Math.min(total, 10) }).map((_, i) => {
          const dotIdx = total > 10 ? Math.floor(idx / total * 10) : idx;
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === dotIdx
                  ? 'w-5 h-1.5 bg-primary'
                  : 'w-1.5 h-1.5 bg-white/25'
              }`}
            />
          );
        })}
      </div>

      {/* Category tag */}
      <div className="flex justify-center pb-8 shrink-0">
        <span className="px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-[12px] font-semibold backdrop-blur-sm">
          {CATS.find(c => c.id === item.cat)?.emoji} {CATS.find(c => c.id === item.cat)?.label}
        </span>
      </div>
    </motion.div>
  );
}
