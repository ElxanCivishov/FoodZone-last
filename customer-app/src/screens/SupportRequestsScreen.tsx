import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MessageSquare, Clock, CheckCircle2,
  Hourglass, CreditCard, AlertCircle, HelpCircle,
} from 'lucide-react';
import { useUIStore } from '@/store';
import { useSupportRequestStore } from '@/store';
import type { SupportTopic, SupportStatus } from '@/store';
import { useT } from '@/hooks/useT';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const STATUS_META: Record<SupportStatus, { icon: typeof Clock; color: string; bg: string }> = {
  sent:      { icon: CheckCircle2, color: 'text-primary',  bg: 'bg-primary-light' },
  in_review: { icon: Hourglass,    color: 'text-warning',  bg: 'bg-warning/10' },
  resolved:  { icon: CheckCircle2, color: 'text-success',  bg: 'bg-success/10' },
};

const TOPIC_META: Record<SupportTopic, { icon: typeof MessageSquare; color: string; bg: string }> = {
  order:   { icon: MessageSquare, color: 'text-primary',        bg: 'bg-primary-light' },
  payment: { icon: CreditCard,    color: 'text-success',        bg: 'bg-success/10' },
  waiter:  { icon: AlertCircle,   color: 'text-warning',        bg: 'bg-warning/10' },
  other:   { icon: HelpCircle,    color: 'text-text-secondary', bg: 'bg-surface-elevated' },
};

function formatTime(iso: string, todayLabel: string, yesterdayLabel: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  if (d.toDateString() === today.toDateString()) return `${todayLabel} · ${timeStr}`;
  if (d.toDateString() === yesterday.toDateString()) return `${yesterdayLabel} · ${timeStr}`;
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} · ${timeStr}`;
}

export default function SupportRequestsScreen() {
  const t = useT();
  const { goBack, setScreen } = useUIStore();
  const { requests } = useSupportRequestStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div
        className="relative px-4 pt-12 pb-6 shrink-0"
        style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
          >
            <ChevronLeft size={20} className="text-white" />
          </motion.button>
          <div>
            <h1 className="font-outfit text-xl font-bold text-white">{t.support.myRequests}</h1>
            <p className="text-white/70 text-[12px] mt-0.5">
              {requests.length > 0 ? `${requests.length} ${t.support.request}` : t.support.noRequests}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
        <AnimatePresence mode="popLayout">
          {requests.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 pt-20 text-center"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
              >
                <MessageSquare size={32} className="text-white" />
              </div>
              <p className="font-outfit text-lg font-bold text-text-primary">{t.support.noRequests}</p>
              <p className="text-text-secondary text-[13px] max-w-[220px]">
                {t.support.noRequestsNote}
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setScreen('help')}
                className="mt-2 px-6 py-3 rounded-2xl text-[14px] font-bold text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
              >
                <MessageSquare size={16} />
                {t.support.sendRequest}
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {requests.map((req, i) => {
                const topic = TOPIC_META[req.topic];
                const TopicIcon = topic.icon;
                const status = STATUS_META[req.status];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, ...SPRING }}
                    className="bg-white rounded-2xl border border-border-light shadow-xs p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl ${topic.bg} flex items-center justify-center shrink-0`}>
                        <TopicIcon size={20} className={topic.color} strokeWidth={2} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[14px] font-semibold text-text-primary">{t.support.topics[req.topic]}</p>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0 ${status.bg}`}>
                            <StatusIcon size={11} className={status.color} />
                            <span className={`text-[11px] font-bold ${status.color}`}>
                              {req.status === 'sent'
                                ? t.support.sent
                                : req.status === 'in_review'
                                  ? t.support.inReview
                                  : t.support.resolved}
                            </span>
                          </div>
                        </div>

                        <p className="text-text-secondary text-[12px] mt-1 line-clamp-2 leading-relaxed">
                          {req.message}
                        </p>

                        <div className="flex items-center gap-1 mt-2">
                          <Clock size={11} className="text-text-tertiary" />
                          <span className="text-text-tertiary text-[11px]">{formatTime(req.createdAt, t.modal.today, t.common.yesterday)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...SPRING }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setScreen('help')}
                className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
              >
                <MessageSquare size={16} />
                {t.support.newRequest}
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
