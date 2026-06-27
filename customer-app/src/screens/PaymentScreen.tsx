import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useUIStore, useOrderStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function PaymentScreen() {
  const { goBack, setScreen, addToast } = useUIStore();
  const { currentOrder, payOrder } = useOrderStore();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [name, setName]             = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(false);
  const [paid, setPaid]             = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (cardNumber.replace(/\s/g, '').length < 16) e.card   = 'Kart nömrəsi 16 rəqəm olmalıdır';
    if (expiry.length < 5)                          e.expiry = 'Tarix MM/YY formatında';
    if (cvv.length < 3)                             e.cvv    = 'CVV 3 rəqəm';
    if (!name.trim())                               e.name   = 'Kart sahibinin adı';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      if (currentOrder) payOrder(currentOrder.id);
      setLoading(false);
      setPaid(true);
      setTimeout(() => setScreen('orderSuccess'), 1500);
    }, 1800);
  };

  const amount = currentOrder?.total?.toFixed(2) ?? '0.00';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-4 pt-12 pb-4 flex items-center gap-3 border-b border-border-light">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <div className="flex-1">
          <h2 className="font-outfit text-[17px] font-bold text-text-primary">Kart ilə Ödəniş</h2>
          <p className="text-[12px] text-text-secondary">SSL şifrələnmiş bağlantı</p>
        </div>
        <div className="flex items-center gap-1">
          <Lock size={13} className="text-success" />
          <span className="text-[11px] font-semibold text-success">Güvənli</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* Amount card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...SPRING }}
          className="rounded-2xl p-5 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #00c2e8, #667eea)' }}
        >
          <div>
            <p className="text-[12px] text-white/70 font-medium">Ödəniləcək məbləğ</p>
            <p className="font-outfit text-[32px] font-bold mt-0.5">{amount} <span className="text-[16px]">AZN</span></p>
            {currentOrder && (
              <p className="text-[11px] text-white/60 mt-1">Sifariş #{currentOrder.id.slice(-6)}</p>
            )}
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <CreditCard size={28} className="text-white" />
          </div>
        </motion.div>

        {/* Card form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ...SPRING }}
          className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 border border-border-light shadow-xs space-y-4"
        >
          {/* Card number */}
          <Field label="Kart nömrəsi" error={errors.card}>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(formatCardNumber(e.target.value));
                  setErrors((er) => ({ ...er, card: '' }));
                }}
                className={inputCls(!!errors.card)}
              />
              <CreditCard size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            </div>
          </Field>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Son istifadə tarixi" error={errors.expiry}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => {
                  setExpiry(formatExpiry(e.target.value));
                  setErrors((er) => ({ ...er, expiry: '' }));
                }}
                className={inputCls(!!errors.expiry)}
              />
            </Field>
            <Field label="CVV" error={errors.cvv}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="•••"
                value={cvv}
                maxLength={4}
                onChange={(e) => {
                  setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setErrors((er) => ({ ...er, cvv: '' }));
                }}
                className={inputCls(!!errors.cvv)}
              />
            </Field>
          </div>

          {/* Cardholder name */}
          <Field label="Kart sahibinin adı" error={errors.name}>
            <input
              type="text"
              placeholder="AD SOYAD"
              value={name}
              onChange={(e) => {
                setName(e.target.value.toUpperCase());
                setErrors((er) => ({ ...er, name: '' }));
              }}
              className={inputCls(!!errors.name)}
            />
          </Field>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-1"
        >
          <ShieldCheck size={14} className="text-text-tertiary shrink-0" />
          <p className="text-[11px] text-text-tertiary">Kart məlumatlarınız şifrələnərək ötürülür və saxlanılmır</p>
        </motion.div>
      </div>

      {/* Pay button */}
      <div className="p-4 border-t border-border-light bg-white dark:bg-[#1a1a2e]">
        <AnimatePresence mode="wait">
          {paid ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-4 rounded-xl bg-success flex items-center justify-center gap-2 text-white text-[15px] font-semibold"
            >
              <CheckCircle2 size={20} /> Ödəniş tamamlandı!
            </motion.div>
          ) : (
            <motion.button
              key="pay"
              whileTap={{ scale: 0.97 }}
              onClick={handlePay}
              disabled={loading}
              className="w-full py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-primary-glow disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  {amount} AZN ödə
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-text-secondary mb-1.5">{label}</p>
      {children}
      {error && <p className="text-coral text-[11px] mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
    hasError ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
  }`;
}
