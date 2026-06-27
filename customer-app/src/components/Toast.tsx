import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store';

const icons = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
};

const colors = {
  success: 'border-success text-success bg-white',
  error:   'border-coral text-coral bg-white',
  info:    'border-primary text-primary bg-white',
};

export default function Toast() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="absolute top-14 left-0 right-0 z-[500] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`pointer-events-auto w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-lg ${colors[t.type]}`}
            >
              <Icon size={18} strokeWidth={2.5} className="shrink-0" />
              <p className="flex-1 text-[13px] font-semibold text-text-primary">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 text-text-tertiary"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
