import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, CreditCard, Check, X, Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

interface Card {
  id: number;
  type: 'visa' | 'mastercard' | 'wallet';
  label: string;
  last4: string | null;
  expires: string | null;
  balance?: string;
  color: [string, string];
}

const INITIAL_CARDS: Card[] = [
  { id: 1, type: 'visa',       label: 'Visa',        last4: '4242', expires: '12/27', color: ['#1a1a2e', '#16213e'] },
  { id: 2, type: 'mastercard', label: 'Mastercard',  last4: '8899', expires: '09/26', color: ['#eb5757', '#b83232'] },
  { id: 3, type: 'wallet',     label: 'FoodZone Pay', last4: null,  expires: null, balance: '42.50', color: ['#00c2e8', '#00c2a8'] },
];

function detectType(num: string): 'visa' | 'mastercard' {
  return num.startsWith('4') ? 'visa' : 'mastercard';
}

function formatCardNum(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

const EMPTY_FORM = { number: '', name: '', expiry: '', cvv: '' };

export default function PaymentsScreen() {
  const { goBack } = useUIStore();
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [selected, setSelected] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const digits = form.number.replace(/\D/g, '');
  const cardType = detectType(digits);
  const previewLast4 = digits.length >= 4 ? digits.slice(-4) : '????';
  const previewColor: [string, string] = cardType === 'visa' ? ['#1a1a2e', '#16213e'] : ['#eb5757', '#b83232'];

  const validate = () => {
    const e: Record<string, string> = {};
    if (digits.length < 16)        e.number = 'Kart nömrəsi 16 rəqəm olmalıdır';
    if (!form.name.trim())         e.name   = 'Ad soyad tələb olunur';
    if (form.expiry.length < 5)    e.expiry = 'Düzgün tarix daxil edin (MM/YY)';
    if (form.cvv.length < 3)       e.cvv    = 'CVV 3 rəqəm olmalıdır';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const newCard: Card = {
      id: Date.now(),
      type: cardType,
      label: cardType === 'visa' ? 'Visa' : 'Mastercard',
      last4: previewLast4,
      expires: form.expiry,
      color: previewColor,
    };
    setCards(prev => [...prev, newCard]);
    setSelected(newCard.id);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setErrors({});
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
      <div className="bg-white px-4 pt-12 pb-4 border-b border-border-light flex items-center gap-3 shrink-0">
        <motion.button whileTap={{ scale: 0.88 }} onClick={goBack}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center">
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <div>
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">Ödəniş üsulları</h1>
          <p className="text-text-secondary text-[13px]">{cards.length} üsul</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-32 space-y-3">
        {/* Cards */}
        <AnimatePresence>
          {cards.map((card, i) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.07, ...SPRING }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(card.id)}
              className="w-full text-left"
            >
              <div
                className="relative rounded-2xl p-5 overflow-hidden"
                style={{ background: `linear-gradient(135deg,${card.color[0]},${card.color[1]})`, minHeight: 112 }}
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -left-4 -bottom-8 w-24 h-24 rounded-full bg-white/[0.06]" />
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">{card.label}</p>
                    {card.last4
                      ? <p className="text-white text-[17px] font-bold tracking-[3px] mt-1">•••• {card.last4}</p>
                      : <p className="text-white text-[22px] font-bold mt-1 font-outfit">{card.balance} AZN</p>
                    }
                    {card.expires && <p className="text-white/50 text-[11px] mt-1">{card.expires}</p>}
                  </div>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected === card.id ? 'border-white bg-white' : 'border-white/40 bg-white/10'
                  }`}>
                    {selected === card.id && <Check size={13} className="text-gray-800" strokeWidth={3} />}
                  </div>
                </div>
                <div className="relative z-10 mt-3">
                  <CreditCard size={24} className="text-white/25" />
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Add new trigger */}
        <AnimatePresence>
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
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
          )}
        </AnimatePresence>

        {/* Add card form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={SPRING}
              className="bg-white rounded-2xl border border-primary/30 shadow-xs overflow-hidden"
            >
              {/* Form header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border-light">
                <p className="font-outfit text-[15px] font-bold text-text-primary">Yeni kart</p>
                <motion.button whileTap={{ scale: 0.88 }}
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}
                  className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                  <X size={14} className="text-text-secondary" />
                </motion.button>
              </div>

              {/* Live card preview */}
              <div className="px-4 pt-4">
                <div
                  className="relative rounded-2xl p-4 overflow-hidden"
                  style={{ background: `linear-gradient(135deg,${previewColor[0]},${previewColor[1]})`, minHeight: 96 }}
                >
                  <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                        {cardType === 'visa' ? 'Visa' : 'Mastercard'}
                      </p>
                      <p className="text-white text-[15px] font-bold tracking-[2px] mt-1">
                        {digits.length > 0
                          ? `•••• •••• •••• ${previewLast4}`
                          : '•••• •••• •••• ••••'}
                      </p>
                      <p className="text-white/50 text-[11px] mt-1">
                        {form.name || 'Ad Soyad'} · {form.expiry || 'MM/YY'}
                      </p>
                    </div>
                    <CreditCard size={22} className="text-white/30 mt-1" />
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="px-4 pb-4 pt-3 space-y-3">
                {/* Card number */}
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-1.5">Kart nömrəsi *</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={form.number}
                    onChange={(e) => {
                      setForm(f => ({ ...f, number: formatCardNum(e.target.value) }));
                      setErrors(er => ({ ...er, number: '' }));
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl border text-[14px] font-mono text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                      errors.number ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                    }`}
                  />
                  {errors.number && <p className="text-coral text-[11px] mt-1">{errors.number}</p>}
                </div>

                {/* Name */}
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-1.5">Kartdakı ad *</p>
                  <input
                    type="text"
                    placeholder="AD SOYAD"
                    value={form.name}
                    onChange={(e) => {
                      setForm(f => ({ ...f, name: e.target.value.toUpperCase() }));
                      setErrors(er => ({ ...er, name: '' }));
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                      errors.name ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                    }`}
                  />
                  {errors.name && <p className="text-coral text-[11px] mt-1">{errors.name}</p>}
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-text-secondary mb-1.5">Son tarix *</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={form.expiry}
                      onChange={(e) => {
                        setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }));
                        setErrors(er => ({ ...er, expiry: '' }));
                      }}
                      className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                        errors.expiry ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                      }`}
                    />
                    {errors.expiry && <p className="text-coral text-[11px] mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-text-secondary mb-1.5">CVV *</p>
                    <div className="relative">
                      <input
                        type={showCvv ? 'text' : 'password'}
                        inputMode="numeric"
                        placeholder="•••"
                        maxLength={4}
                        value={form.cvv}
                        onChange={(e) => {
                          setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }));
                          setErrors(er => ({ ...er, cvv: '' }));
                        }}
                        className={`w-full h-11 px-3.5 pr-9 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                          errors.cvv ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                      >
                        {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {errors.cvv && <p className="text-coral text-[11px] mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className="w-full h-11 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
                  style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
                >
                  <Check size={16} />
                  Kartı əlavə et
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm */}
      {!showForm && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-border-light">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goBack}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white shadow-primary-glow"
            style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
          >
            Seçimi təsdiqlə
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
