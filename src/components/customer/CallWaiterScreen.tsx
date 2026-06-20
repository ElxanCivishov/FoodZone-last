import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { post } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import { useSocketContext } from '@/services/socket';
import { useUIStore } from '@/stores/uiStore';
import { WAITER_REQUEST_TYPES } from '@/utils/constants';
import { Bell, Droplets, ScrollText, Receipt, Sparkles, MessageCircle, Loader2 } from 'lucide-react';

const iconMap: Record<string, React.FC<any>> = {
  Bell, Droplets, ScrollText, Receipt, Sparkles, MessageCircle,
};

export function CallWaiterScreen() {
  const { session } = useSessionStore();
  const { socket } = useSocketContext();
  const { setScreen, addNotification } = useUIStore();
  const [selectedType, setSelectedType] = useState('');
  const [message, setMessage] = useState('');

  const requestMutation = useMutation({
    mutationFn: () => post('/waiter-requests', {
      tableId: session!.tableId,
      type: selectedType,
      message: message || undefined,
    }),
    onSuccess: () => {
      socket?.emit('waiter:new:request', {
        tableId: session!.tableId,
        type: selectedType,
        message,
      });
      addNotification({ type: 'success', message: 'Request sent!' });
      setScreen('home');
    },
  });

  return (
    <div className="min-h-screen bg-dark-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-2">Call Waiter</h1>
      <p className="text-dark-400 mb-6">Select what you need</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {WAITER_REQUEST_TYPES.map((type) => {
          const Icon = iconMap[type.icon] || Bell;
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                isSelected ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-dark-800 border-dark-700 text-dark-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="capitalize text-sm font-medium">{type.id}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label className="block text-sm text-dark-400 mb-2">Additional Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any specific request..."
          className="w-full bg-dark-800 border border-dark-700 rounded-xl p-4 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          rows={3}
        />
      </div>

      <button
        onClick={() => requestMutation.mutate()}
        disabled={!selectedType || requestMutation.isPending}
        className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
      >
        {requestMutation.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
        ) : (
          'Send Request'
        )}
      </button>

      {requestMutation.isError && (
        <p className="text-red-400 text-center mt-3 text-sm">
          {requestMutation.error?.message || 'Failed to send request'}
        </p>
      )}
    </div>
  );
}
