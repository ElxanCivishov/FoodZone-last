import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Phone, ChevronDown, Send, CheckCircle2,
  MessageSquare, AlertCircle, CreditCard, HelpCircle,
} from 'lucide-react';
import { useUIStore } from '@/store';
import { useSupportRequestStore } from '@/store';
import type { SupportTopic } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const TOPICS: { id: SupportTopic; icon: typeof MessageSquare; label: string }[] = [
  { id: 'order',   icon: MessageSquare, label: 'Sifariş problemi' },
  { id: 'payment', icon: CreditCard,    label: 'Ödəniş məsələsi' },
  { id: 'waiter',  icon: AlertCircle,   label: 'Xidmət şikayəti' },
  { id: 'other',   icon: HelpCircle,    label: 'Digər' },
];


export default function HelpScreen() {
  const { goBack, addToast } = useUIStore();
  const { addRequest } = useSupportRequestStore();

  const [topic, setTopic] = useState<SupportTopic | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const MAX = 400;

  const handleSend = () => {
    if (!topic) { addToast('Mövzu seçin', 'error'); return; }
    if (message.trim().length < 10) { addToast('Mesajı ətraflı yazın', 'error'); return; }
    setSending(true);
    // TODO: POST /api/support { topic, message }
    setTimeout(() => {
      addRequest(topic as SupportTopic, message);
      setSending(false);
      setJustSent(true);
      setTopic('');
      setMessage('');
      addToast('Müraciətiniz göndərildi!', 'success');
      setTimeout(() => setJustSent(false), 3000);
    }, 1200);
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
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">Dəstək</h1>
          <p className="text-text-secondary text-[12px] mt-0.5">Müraciətinizi göndərin, tez cavab alın</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-3">

        {/* Phone */}
        <a href="tel:+994125550000"
          className="flex items-center gap-3 px-4 py-4 bg-white rounded-2xl border border-border-light shadow-xs active:bg-surface-elevated transition-colors">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
            <Phone size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-text-primary">Zəng edin</p>
            <p className="text-[12px] text-text-secondary mt-0.5">+994 12 555 00 00</p>
          </div>
          <span className="text-[11px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">10:00–22:00</span>
        </a>

        {/* Support form card */}
        <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
          <motion.button whileTap={{ scale: 0.99 }} onClick={() => setFormOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}>
              <MessageSquare size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-semibold text-text-primary">Dəstək müraciəti</p>
              <p className="text-[12px] text-text-secondary mt-0.5">24 saat ərzində cavab</p>
            </div>
            <motion.div animate={{ rotate: formOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} className="text-text-tertiary" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {formOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-border-light"
              >
                <AnimatePresence mode="wait">
                  {justSent ? (
                    <motion.div key="success"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }} transition={SPRING}
                      className="flex flex-col items-center gap-3 py-8 px-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#06d6a0,#00c2a8)' }}>
                        <CheckCircle2 size={28} className="text-white" />
                      </div>
                      <p className="font-outfit text-[16px] font-bold text-text-primary text-center">Müraciətiniz qəbul edildi</p>
                      <p className="text-text-secondary text-[13px] text-center">Aşağıda statusunu izləyə bilərsiniz</p>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="px-4 pb-4 pt-3 space-y-3">
                      {/* Topic pills */}
                      <div>
                        <p className="text-[12px] font-semibold text-text-tertiary mb-2">Mövzu</p>
                        <div className="grid grid-cols-2 gap-2">
                          {TOPICS.map(({ id, icon: Icon, label }) => {
                            const active = topic === id;
                            return (
                              <motion.button key={id} whileTap={{ scale: 0.94 }} onClick={() => setTopic(id)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                                  active ? 'border-primary bg-primary-light' : 'border-transparent bg-surface-elevated'
                                }`}>
                                <Icon size={14} className={active ? 'text-primary' : 'text-text-tertiary'} strokeWidth={active ? 2.2 : 1.8} />
                                <span className={`text-[12px] font-semibold leading-tight ${active ? 'text-primary' : 'text-text-secondary'}`}>
                                  {label}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message */}
                      <div className="relative">
                        <p className="text-[12px] font-semibold text-text-tertiary mb-2">Mesaj</p>
                        <textarea rows={3} placeholder="Probleminizi ətraflı izah edin…"
                          value={message} maxLength={MAX} onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-4 py-3 bg-surface-elevated border border-border-light rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-primary transition-colors" />
                        <span className="absolute bottom-3 right-3 text-[11px] text-text-tertiary">{message.length}/{MAX}</span>
                      </div>

                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={sending}
                        className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow disabled:opacity-70"
                        style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}>
                        {sending ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            Göndərilir…
                          </>
                        ) : (
                          <><Send size={15} />Göndər</>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
