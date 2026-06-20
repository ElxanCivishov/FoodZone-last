import { useOrderStore } from '@/stores/orderStore';
import { useUIStore } from '@/stores/uiStore';

export function OrderSuccessScreen() {
  const { currentOrder } = useOrderStore();
  const { setScreen } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">✅</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
      <p className="text-dark-400 text-center mb-2">
        Your order <span className="text-primary-400 font-bold">#{currentOrder?.orderNumber}</span> has been sent to the kitchen
      </p>
      <p className="text-dark-400 text-center mb-8">
        Estimated time: 15-20 minutes
      </p>

      <div className="w-full max-w-sm space-y-3">
        <button onClick={() => setScreen('order-tracking')} className="w-full bg-primary-500 hover:bg-primary-600 py-3 rounded-xl font-medium">
          Track Order
        </button>
        <button onClick={() => setScreen('home')} className="w-full bg-dark-800 hover:bg-dark-700 py-3 rounded-xl font-medium text-dark-400">
          Back to Menu
        </button>
      </div>
    </div>
  );
}
