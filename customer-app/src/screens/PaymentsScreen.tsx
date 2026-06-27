import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, CreditCard, Check } from 'lucide-react';
import { useUIStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const CARDS = [
  { id: 1, type: 'visa', label: 'Visa', last4: '4242', expires: '12/27', color: ['#1a1a2e', '#16213e'] },
  { id: 2, type: 'mastercard', label: 'Mastercard', last4: '8899', expires: '09/26', color: ['#eb5757', '#b83232'] },
  { id: 3, type: 'wallet', label: 'FoodZone Pay', last4: null, expires: null, balance: '42.50', color: ['#00c2e8', '#00c2a8'] },
];

export default function PaymentsScreen() {
  const { goBack } = useUIStore();
  const [selected, setSelected] = useState(1);

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
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">Ödəniş üsulları</h1>
          <p className="text-text-secondary text-[13px]">{CARDS.length} üsul</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-32 space-y-3">
        {CARDS.map((card, i) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ...SPRING }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(card.id)}
            className="w-full text-left"
          >
            {/* Card visual */}
            <div
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${card.color[0]}, ${card.color[1]})`, minHeight: 120 }}
            >
              {/* Decorative circles */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -left-4 -bottom-8 w-24 h-24 rounded-full bg-white/8" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider">{card.label}</p>
                  {card.last4 ? (
                    <p className="text-white text-[18px] font-bold tracking-[3px] mt-1">•••• {card.last4}</p>
                  ) : (
                    <p className="text-white text-[22px] font-bold mt-1 font-outfit">{card.balance} AZN</p>
                  )}
                  {card.expires && (
                    <p className="text-white/60 text-[11px] mt-1">{card.expires}</p>
                  )}
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected === card.id ? 'border-white bg-white' : 'border-white/40 bg-white/10'
                }`}>
                  {selected === card.id && <Check size={14} className="text-text-primary" strokeWidth={3} />}
                </div>
              </div>

              <div className="relative z-10 mt-4">
                <CreditCard size={28} className="text-white/30" />
              </div>
            </div>
          </motion.button>
        ))}

        {/* Add new card */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, ...SPRING }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-primary/40 shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Plus size={18} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-primary">Yeni kart əlavə et</p>
            <p className="text-[12px] text-text-secondary mt-0.5">Visa, Mastercard qəbul edilir</p>
          </div>
        </motion.button>
      </div>

      {/* Confirm button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-border-light">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goBack}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white shadow-primary-glow"
          style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
        >
          Seçimi təsdiqlə
        </motion.button>
      </div>
    </motion.div>
  );
}
