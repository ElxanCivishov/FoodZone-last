import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Tag, Check, X, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const ACTIVE_COUPONS = [
  { id: 1, code: 'WELCOME20', desc: 'İlk sifarişdə %20 endirim', value: '%20', min: 15, expires: '30 İyun 2026', color: '#00c2e8' },
  { id: 2, code: 'SUSHI15', desc: 'Sushi sifarişlərində %15', value: '%15', min: 20, expires: '15 İyul 2026', color: '#667eea' },
];

const EXPIRED_COUPONS = [
  { id: 3, code: 'SPRING10', desc: 'Bahar endirimi', value: '%10', min: 10, expires: '31 May 2026' },
];

export default function CouponsScreen() {
  const { goBack, addToast } = useUIStore();
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<'active' | 'expired'>('active');
  const [applied, setApplied] = useState<number | null>(null);

  const applyCode = () => {
    if (!code.trim()) return;
    const found = ACTIVE_COUPONS.find(c => c.code === code.toUpperCase());
    if (found) {
      addToast(`"${found.code}" kodu tətbiq edildi!`, 'success');
      setCode('');
    } else {
      addToast('Geçərsiz kupon kodu', 'error');
    }
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
      <div className="bg-white px-4 pt-12 pb-4 border-b border-border-light flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={goBack}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <div>
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">Kuponlarım</h1>
          <p className="text-text-secondary text-[13px]">{ACTIVE_COUPONS.length} aktiv kupon</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {/* Code input */}
        <div className="px-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Kupon kodunu daxil edin"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-border-light bg-white text-[14px] font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={applyCode}
              className="px-5 h-12 rounded-xl text-[14px] font-bold text-white shadow-primary-glow shrink-0"
              style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
            >
              Tətbiq et
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 bg-white rounded-xl p-1 shadow-xs border border-border-light mb-4">
          {(['active', 'expired'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t ? 'bg-primary text-white shadow-primary-glow' : 'text-text-secondary'
              }`}
            >
              {t === 'active' ? 'Aktiv' : 'Müddəti bitmiş'}
            </button>
          ))}
        </div>

        <div className="px-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {(tab === 'active' ? ACTIVE_COUPONS : EXPIRED_COUPONS).map((coupon, i) => {
              const isApplied = applied === coupon.id;
              const isExpired = tab === 'expired';
              return (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.07, ...SPRING }}
                  className={`bg-white rounded-2xl overflow-hidden border shadow-xs ${isApplied ? 'border-primary' : 'border-border-light'} ${isExpired ? 'opacity-60' : ''}`}
                >
                  {/* Colored top strip */}
                  <div
                    className="h-1.5"
                    style={{ background: isExpired ? '#9ca3af' : (coupon as typeof ACTIVE_COUPONS[0]).color ?? '#00c2e8' }}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary text-[11px] font-bold tracking-wide font-outfit">
                            {coupon.code}
                          </span>
                          <span className="text-[13px] font-bold text-text-primary">{coupon.value} endirim</span>
                        </div>
                        <p className="text-[12px] text-text-secondary mt-1.5">{coupon.desc}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-text-tertiary">
                          <span>Min sifariş: {coupon.min} AZN</span>
                          <span>•</span>
                          <span>Son tarix: {coupon.expires}</span>
                        </div>
                      </div>
                      {!isExpired && (
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => setApplied(isApplied ? null : coupon.id)}
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isApplied ? 'bg-primary text-white' : 'bg-surface-elevated text-text-secondary'
                          }`}
                        >
                          {isApplied ? <Check size={16} /> : <ChevronRight size={16} />}
                        </motion.button>
                      )}
                      {isExpired && (
                        <X size={16} className="text-text-tertiary shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {tab === 'expired' && EXPIRED_COUPONS.length === 0 && (
            <div className="text-center py-12 text-text-tertiary text-[14px]">
              Müddəti bitmiş kupon yoxdur
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
