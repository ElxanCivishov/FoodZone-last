import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useOrderStore } from '@/stores/orderStore';
import { ArrowRight, Home } from 'lucide-react';

const CONFETTI_COUNT = 28;

const CONFETTI_COLORS = [
  '#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6',
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const x = randomBetween(-160, 160);
  const y = randomBetween(-200, -80);
  const rotate = randomBetween(-360, 360);
  const scale = randomBetween(0.6, 1.2);
  const delay = randomBetween(0, 0.35);
  const isCircle = index % 3 === 0;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 pointer-events-none"
      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
      animate={{
        x,
        y,
        opacity: [1, 1, 0],
        scale: [0, scale, scale * 0.5],
        rotate,
      }}
      transition={{
        duration: 1.0,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        style={{ background: color }}
        className={`${isCircle ? 'w-2.5 h-2.5 rounded-full' : 'w-2 h-3 rounded-sm'}`}
      />
    </motion.div>
  );
}

export function OrderSuccessScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const burstRef = useRef(false);

  useEffect(() => {
    burstRef.current = true;
    // Auto-redirect to feedback after 4 s
    const timer = setTimeout(() => setScreen('feedback'), 4000);
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Animated checkmark with confetti */}
        <div className="relative flex items-center justify-center">
          {/* Confetti burst */}
          <AnimatePresence>
            {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </AnimatePresence>

          {/* Pulsing ring */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute w-32 h-32 rounded-full bg-success-500/20"
          />

          {/* Icon container */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
            className="relative w-24 h-24 bg-success-500/10 border-2 border-success-500/30 rounded-full flex items-center justify-center"
          >
            {/* SVG animated checkmark */}
            <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
              <motion.path
                d="M10 26 L20 36 L38 16"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.4 }}
        >
          <h1 className="text-2xl font-bold mb-2">{t('order.success')}</h1>
          <p className="text-foreground-muted">
            {t('order.number')}:{' '}
            <span className="font-bold text-foreground">
              #{currentOrder?.orderNumber || 'N/A'}
            </span>
          </p>
        </motion.div>

        {/* Progress card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.55 }}
          className="p-4 bg-surface-elevated border border-border rounded-2xl"
        >
          <p className="text-sm text-foreground-muted mb-1">{t('order.status.preparing')}</p>
          <div className="w-full bg-foreground-muted/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '33%' }}
              transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
              className="bg-primary-500 h-full rounded-full"
            />
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.7 }}
          className="space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('order-tracking')}
            className="w-full flex items-center justify-center gap-2 py-3 btn-primary rounded-xl font-medium"
          >
            {t('order.tracking')}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen('home')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl hover:border-primary-500 transition-colors btn-press"
          >
            <Home className="w-5 h-5" />
            {t('home.menu')}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
