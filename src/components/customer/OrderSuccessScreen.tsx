import { motion } from 'framer-motion';
import { CheckCircle, MapPin, Clock } from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';
import { useUIStore } from '@/stores/uiStore';

export function OrderSuccessScreen() {
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const setScreen = useUIStore((s) => s.setScreen);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.8 }} className="text-center max-w-sm w-full">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-400" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-white mb-2">Order Received!</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-dark-400 mb-8">Your order has been sent to the kitchen</motion.p>
        {currentOrder && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 mb-8 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-dark-400">Order Number</span>
              <span className="text-2xl font-bold text-primary-400">#{currentOrder.orderNumber}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-dark-300"><MapPin size={18} className="text-primary-400" /><span>Table {currentOrder.table?.number || '5'}</span></div>
              <div className="flex items-center gap-3 text-dark-300"><Clock size={18} className="text-primary-400" /><span>Estimated: 20-30 min</span></div>
            </div>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3">
          <button onClick={() => setScreen('order-tracking')} className="w-full btn-primary py-4">Track Order</button>
          <button onClick={() => setScreen('home')} className="w-full btn-secondary py-3">Back to Menu</button>
        </motion.div>
      </motion.div>
    </div>
  );
}
