import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Banknote, Globe, MessageSquare } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSocketContext } from '@/services/socket';
import toast from 'react-hot-toast';

type PaymentMethod = 'cash' | 'card' | 'online';

export function CheckoutScreen() {
  const setScreen = useUIStore((s) => s.setScreen);
  const { items, subtotal, serviceFee, discount, total, clearCart } = useCartStore();
  const { placeOrder, isPlacingOrder } = useOrderStore();
  const session = useSessionStore((s) => s.session);
  const { emitEvent } = useSocketContext();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [specialRequest, setSpecialRequest] = useState('');

  const handlePlaceOrder = async () => {
    if (!session) { toast.error('Session not found'); return; }
    try {
      const orderData = {
        tableId: session.tableId, branchId: session.branchId,
        items: items.map((item) => ({
          productId: item.productId, quantity: item.quantity,
          selectedSizeId: item.selectedSize?.id, unitPrice: item.unitPrice,
          totalPrice: item.totalPrice, specialNote: item.specialNote,
        })),
        subtotal, serviceFee, discount, total, paymentMethod,
        specialRequest: specialRequest || undefined,
      };
      await placeOrder(orderData, emitEvent);
      clearCart();
      setScreen('order-success');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    }
  };

  const paymentMethods = [
    { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
    { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
    { id: 'online' as PaymentMethod, label: 'Online', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-dark-900 pb-40">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setScreen('cart')} className="text-dark-400 hover:text-white"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-white">Checkout</h1>
      </div>
      <div className="px-4 py-6 space-y-6">
        <div className="glass-panel p-4">
          <h2 className="text-white font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-dark-300">{item.quantity}x {item.product.name}</span>
                <span className="text-white">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-dark-700 pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-dark-400 text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-dark-400 text-sm"><span>Service Fee</span><span>${serviceFee.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-400 text-sm"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-white font-bold pt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-white font-semibold mb-3">Payment Method</h2>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${paymentMethod === method.id ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-dark-800 border-dark-700 text-dark-400'}`}>
                  <Icon size={24} /><span className="text-sm font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><MessageSquare size={18} /> Special Request</h2>
          <textarea value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} placeholder="Any special requests for the kitchen..." className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none h-24" />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-xl border-t border-dark-700 p-4 z-40">
        <button onClick={handlePlaceOrder} disabled={isPlacingOrder} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2">
          {isPlacingOrder ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>Place Order <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">${total.toFixed(2)}</span></>
          )}
        </button>
      </div>
    </div>
  );
}
