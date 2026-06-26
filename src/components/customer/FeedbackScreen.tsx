import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { post } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

interface FeedbackScreenProps {
  orderId?: string;
}

export function FeedbackScreen({ orderId }: FeedbackScreenProps) {
  const { t } = useTranslation();
  const setScreen = useUIStore(s => s.setScreen);
  const session = useSessionStore(s => s.session);

  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      await post('/feedback', {
        orderId: orderId ?? null,
        branchId: session?.branchId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSent(true);
      setTimeout(() => setScreen('home'), 2500);
    } catch {
      // silent — do not block the user
      setSent(true);
      setTimeout(() => setScreen('home'), 2500);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="space-y-4"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-6xl"
          >
            🙏
          </motion.div>
          <h2 className="text-2xl font-bold">{t('feedback.thankYou')}</h2>
          <p className="text-foreground-muted">{t('feedback.recorded')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h2 className="text-2xl font-bold">{t('feedback.title')}</h2>
          <p className="text-foreground-muted text-sm">{t('feedback.subtitle')}</p>
        </motion.div>

        {/* Stars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-3"
        >
          {[1, 2, 3, 4, 5].map(star => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-colors"
            >
              <Star
                className={cn(
                  'w-11 h-11 transition-all',
                  star <= (hover || rating)
                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                    : 'text-foreground-muted/25',
                )}
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Comment box + submit */}
        <AnimatePresence>
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="space-y-3"
            >
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('feedback.commentPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-elevated resize-none focus:outline-none focus:border-primary-500 transition-colors text-sm"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={submit}
                disabled={submitting}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white text-base font-semibold rounded-2xl transition-colors disabled:opacity-60"
              >
                {submitting ? '...' : t('feedback.submit')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={() => setScreen('home')}
            className="text-sm text-foreground-muted hover:text-foreground underline transition-colors"
          >
            {t('feedback.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
