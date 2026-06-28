import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ChevronRight, Home, CreditCard, AlertCircle } from 'lucide-react';
import { useUIStore, useOrderStore } from '@/store';
import { useT } from '@/hooks/useT';

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 26 };

const PARTICLES = [
  { x: -80, y: -120, color: '#00c2e8', size: 8, delay: 0.1 },
  { x: 60,  y: -100, color: '#00c2a8', size: 6, delay: 0.15 },
  { x: -120, y: -60, color: '#667eea', size: 10, delay: 0.2 },
  { x: 100,  y: -80, color: '#f093fb', size: 7, delay: 0.12 },
  { x: -60,  y: -140, color: '#ffd166', size: 9, delay: 0.18 },
  { x: 130,  y: -40, color: '#06d6a0', size: 6, delay: 0.22 },
  { x: 40,  y: -150, color: '#ef476f', size: 8, delay: 0.08 },
  { x: -140, y: -90, color: '#118ab2', size: 7, delay: 0.25 },
];

export default function OrderSuccessScreen() {
  const { setScreen } = useUIStore();
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const t = useT();
  const [showContent, setShowContent] = useState(false);
  const isPendingPayment = currentOrder?.paymentStatus === 'pending';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-canvas flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,194,232,0.25), transparent)' }}
      />

      {/* Confetti particles */}
      <AnimatePresence>
        {showContent && PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
            transition={{ delay: p.delay, duration: 0.8, ease: [0.2, 0.8, 0.4, 1] }}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              background: p.color,
              top: '38%', left: '50%',
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.15 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_8px_40px_rgba(0,194,168,0.40)]"
          style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.35 }}
          >
            <CheckCircle2 size={44} className="text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Text */}
        <AnimatePresence>
          {showContent && (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.4 }}
                className="font-outfit text-[26px] font-bold text-text-primary leading-tight"
              >
                {t.order.success}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.5 }}
                className="text-text-secondary text-[15px] mt-2"
              >
                {t.order.subSuccess}
              </motion.p>
            </>
          )}
        </AnimatePresence>

        {/* Order info card */}
        {currentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING, delay: 0.55 }}
            className="mt-8 w-full bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-border-light">
              <div>
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide font-semibold">{t.order.orderNo}</p>
                <p className="font-outfit text-[18px] font-bold text-text-primary mt-0.5">{currentOrder.id}</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
              >
                <CheckCircle2 size={18} className="text-white" />
              </div>
            </div>

            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary">{t.order.estimatedTime}</p>
                <p className="text-[16px] font-bold text-text-primary">
                  ~{currentOrder.estimatedTime} {t.order.minutes}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending payment warning */}
        {isPendingPayment && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING, delay: 0.6 }}
            className="mt-4 w-full bg-warning/10 border border-warning/30 rounded-2xl p-3 flex items-center gap-3"
          >
            <AlertCircle size={18} className="text-warning shrink-0" />
            <p className="text-[13px] text-warning font-medium flex-1">
              {t.order.pendingPaymentWarning}
            </p>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.65 }}
          className="mt-6 w-full flex flex-col gap-3"
        >
          {isPendingPayment ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setScreen('payment')}
              className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#f6a623,#f5576c)' }}
            >
              <CreditCard size={18} />
              {t.order.payNow} — {currentOrder?.total?.toFixed(2)} {t.common.currency}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setScreen('tracking')}
              className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
              style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
            >
              {t.order.track}
              <ChevronRight size={18} />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('home')}
            className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-text-secondary bg-white border border-border-light flex items-center justify-center gap-2"
          >
            <Home size={16} />
            {t.order.backHome}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
