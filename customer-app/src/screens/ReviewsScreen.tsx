import { motion } from 'framer-motion';
import { ChevronLeft, Star, MessageSquare } from 'lucide-react';
import { useUIStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const REVIEWS = [
  {
    id: 1,
    product: 'Salmon Nigiri',
    restaurant: 'Şuba restoranı',
    rating: 5,
    comment: 'Çox ləzzətli idi, təzəliyi hiss olunurdu. Tövsiyə edirəm!',
    date: '15 İyun 2026',
    image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=80&q=80',
  },
  {
    id: 2,
    product: 'Dragon Roll',
    restaurant: 'Şuba restoranı',
    rating: 4,
    comment: 'Gözəl hazırlanmışdı, amma bir az gözlədim.',
    date: '2 İyun 2026',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&q=80',
  },
  {
    id: 3,
    product: 'Miso Ramen',
    restaurant: 'Şuba restoranı',
    rating: 5,
    comment: 'Əla dad, istilik tam yerindəydi. Yenidən sifariş verəcəyəm.',
    date: '20 May 2026',
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=80&q=80',
  },
];

function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= count ? 'text-warning fill-warning' : 'text-border-light fill-border-light'}
        />
      ))}
    </div>
  );
}

export default function ReviewsScreen() {
  const { goBack, openModal } = useUIStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-border-light flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={goBack}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <div>
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">Rəylərim</h1>
          <p className="text-text-secondary text-[13px]">{REVIEWS.length} rəy</p>
        </div>
      </div>

      {/* Average rating banner */}
      <div
        className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
      >
        <div className="text-center">
          <p className="text-white font-outfit text-[36px] font-bold leading-none">4.7</p>
          <Stars count={5} size={13} />
          <p className="text-white/70 text-[11px] mt-1">{REVIEWS.length} rəy</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3].map((n) => {
            const count = REVIEWS.filter((r) => r.rating === n).length;
            const pct = Math.round((count / REVIEWS.length) * 100);
            return (
              <div key={n} className="flex items-center gap-2">
                <span className="text-white/70 text-[11px] w-3">{n}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-white/70 text-[11px] w-7">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-24 space-y-3">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ...SPRING }}
            className="bg-white rounded-2xl border border-border-light shadow-xs p-4"
          >
            <div className="flex items-start gap-3">
              <img src={r.image} alt={r.product} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary">{r.product}</p>
                    <p className="text-[11px] text-text-secondary">{r.restaurant}</p>
                  </div>
                  <Stars count={r.rating} size={12} />
                </div>
                <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">{r.comment}</p>
                <p className="text-[11px] text-text-tertiary mt-2">{r.date}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Write review CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ...SPRING }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openModal('feedback')}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-border-light shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-warning" />
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-text-primary">Yeni rəy yaz</p>
            <p className="text-[12px] text-text-secondary mt-0.5">Sifarişinizi qiymətləndirin</p>
          </div>
          <Star size={16} className="text-warning fill-warning ml-auto" />
        </motion.button>
      </div>
    </motion.div>
  );
}
