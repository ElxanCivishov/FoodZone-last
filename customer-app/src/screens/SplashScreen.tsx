import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store';

export default function SplashScreen() {
  const { setScreen, setActiveTab } = useUIStore();

  useEffect(() => {
    const t = setTimeout(() => {
      setActiveTab('home');
      setScreen('home');
    }, 2800);
    return () => clearTimeout(t);
  }, [setScreen, setActiveTab]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #00c2e8 0%, #00c2a8 100%)' }}
    >
      {/* Deco blobs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[20%] -right-[20%] w-[300px] h-[300px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-[15%] -left-[15%] w-[250px] h-[250px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
          className="w-[110px] h-[110px] bg-white rounded-[28px] flex items-center justify-center shadow-xl mb-6"
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#e0f8ff" />
            <path d="M16 36c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#00c2e8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="28" cy="20" r="5" fill="#00c2e8" />
            <path d="M22 36h12M19 40h18" stroke="#00c2a8" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          className="text-white font-outfit text-5xl font-bold tracking-[-2px]"
        >
          FoodZone
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: 'easeOut' }}
          className="text-white/80 text-[15px] font-medium mt-2"
        >
          Ən yaxşı yeməklər bir yerdə
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-12 w-[200px]"
        >
          <div className="h-1 rounded-full bg-white/25 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: 1.6, ease: 'easeInOut' }}
              className="h-full rounded-full bg-white relative overflow-hidden shimmer-bar"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
