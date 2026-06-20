import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { post } from '@/services/api';
import { Bell, Droplets, ScrollText, Receipt, Sparkles, MessageCircle, ChevronLeft, Send, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const requestTypes = [
  { id: 'call', icon: Bell, label: 'waiter.call' },
  { id: 'water', icon: Droplets, label: 'waiter.water' },
  { id: 'napkin', icon: ScrollText, label: 'waiter.napkin' },
  { id: 'bill', icon: Receipt, label: 'waiter.bill' },
  { id: 'clean', icon: Sparkles, label: 'waiter.clean' },
  { id: 'other', icon: MessageCircle, label: 'waiter.other' },
] as const;

export function CallWaiterScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const session = useSessionStore((state) => state.session);
  const [selectedType, setSelectedType] = useState<string>('call');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!session) return;
    try {
      await post('/waiter-requests', {
        tableId: session.tableId,
        type: selectedType,
        message: message || undefined,
      });
      setSent(true);
      toast.success(t('waiter.sent'));
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('waiter.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {requestTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all',
                  selectedType === type.id
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                    : 'border-border bg-surface-elevated text-foreground-muted hover:text-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{t(type.label)}</span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('waiter.message')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('waiter.message')}
            className="w-full p-3 bg-surface-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-primary-500 min-h-[100px] resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sent}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2',
            sent
              ? 'bg-success-500/10 text-success-500 border border-success-500/20'
              : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]'
          )}
        >
          {sent ? <CheckCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          {sent ? t('waiter.sent') : t('waiter.send')}
        </button>
      </div>
    </div>
  );
}
