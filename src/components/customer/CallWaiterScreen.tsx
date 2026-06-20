import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Droplets, ScrollText, Receipt, Sparkles, MessageCircle, Send } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSocketContext } from '@/services/socket';
import { WAITER_REQUEST_TYPES } from '@/utils/constants';
import toast from 'react-hot-toast';

export function CallWaiterScreen() {
  const setScreen = useUIStore((s) => s.setScreen);
  const session = useSessionStore((s) => s.session);
  const { emitEvent } = useSocketContext();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const iconMap: Record<string, typeof Bell> = {
    call: Bell, water: Droplets, napkin: ScrollText, bill: Receipt, clean: Sparkles, other: MessageCircle,
  };

  const handleSend = async () => {
    if (!selectedType || !session) { toast.error('Please select a request type'); return; }
    setSending(true);
    try {
      const response = await fetch('/api/waiter-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: session.tableId, type: selectedType, message: message || undefined }),
      });
      if (!response.ok) throw new Error('Failed to send request');
      const data = await response.json();
      emitEvent('waiter:new:request', { requestId: data.id, tableId: session.tableId, type: selectedType, message: message || undefined });
      toast.success('Waiter notified!');
      setScreen('home');
    } catch (error) { toast.error('Failed to send request'); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-32">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setScreen('home')} className="text-dark-400 hover:text-white"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-white">Call Waiter</h1>
      </div>
      <div className="px-4 py-6">
        <p className="text-dark-400 mb-6">Select what you need</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {WAITER_REQUEST_TYPES.map((type) => {
            const Icon = iconMap[type.id] || Bell;
            const isSelected = selectedType === type.id;
            return (
              <motion.button key={type.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedType(type.id)} className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${isSelected ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-dark-800 border-dark-700 text-dark-300'}`}>
                <Icon size={28} /><span className="font-medium text-sm">{type.id.charAt(0).toUpperCase() + type.id.slice(1)}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="mb-6">
          <label className="text-white font-medium mb-2 block">Additional Message (optional)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any additional details..." className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none h-24" />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-xl border-t border-dark-700 p-4 z-40">
        <button onClick={handleSend} disabled={!selectedType || sending} className="w-full btn-primary py-4 flex items-center justify-center gap-2">
          {sending ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (<> <Send size={18} /> Send Request </>)}
        </button>
      </div>
    </div>
  );
}
