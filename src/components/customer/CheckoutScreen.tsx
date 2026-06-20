import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { post } from '@/services/api';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useOrderStore } from '@/stores/orderStore';
import { useUIStore } from '@/stores/uiStore';
import { useSocketContext } from '@/services/socket';
import { Loader2 } from 'lucide-react';

export function CheckoutScreen() {
  const { items, subtotal, serviceFee, discount, total, coupon, clearCart } = useCartStore();
  const { session } = useSessionStore();
  const { setCurrentOrder } = useOrderStore();
  const { setScreen } = useUIStore();
  const { socket } = useSocketContext();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [specialRequest, setSpecialRequest] = useState('');

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        tableId: session!.tableId,
        branchId: session!.branchId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          selectedSizeId: i.selectedSize?.id,
          selectedExtras: i.selectedExtras.map((e) => e.id),
          specialNote: i.specialNote,
        })),
        paymentMethod,
        specialRequest: specialRequest || undefined,
        discountCode: coupon?.code,
      };
      return post('/orders', orderData);
    },
    onSuccess: (response: any) => {
      const order = response.data;
      setCurrentOrder(order);
      socket?.emit('order:placed', {
        orderId: order.id,
        tableId: order.tableId,
        branchId: order.branchId,
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.total,
        status: order.status,
      });
      clearCart();
      setScreen('order-success');
    },
  });

  if (!session) return null;

  return (
    <div className="min-h-screen bg-dark-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mb-4">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.quantity}x {item.product.name}</span>
              <span>${item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dark-700 mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-dark-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-dark-400">
            <span>Service Fee (5%)</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount {coupon?.code && `(${coupon.code})`}</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Total</span>
            <span className="text-primary-400">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mb-4">
        <h2 className="font-semibold mb-3">Payment Method</h2>
        <div className="space-y-2">
          {(['cash', 'card', 'online'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`w-full p-3 rounded-lg border text-left capitalize transition-colors ${
                paymentMethod === method ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mb-6">
        <h2 className="font-semibold mb-3">Special Request</h2>
        <textarea
          value={specialRequest}
          onChange={(e) => setSpecialRequest(e.target.value)}
          placeholder="Any allergies or special instructions..."
          className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          rows={3}
        />
      </div>

      <button
        onClick={() => placeOrderMutation.mutate()}
        disabled={placeOrderMutation.isPending || items.length === 0}
        className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
      >
        {placeOrderMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Placing Order...
          </>
        ) : (
          `Place Order - $${total.toFixed(2)}`
        )}
      </button>

      {placeOrderMutation.isError && (
        <p className="text-red-400 text-center mt-3 text-sm">
          {placeOrderMutation.error?.message || 'Failed to place order'}
        </p>
      )}
    </div>
  );
}
