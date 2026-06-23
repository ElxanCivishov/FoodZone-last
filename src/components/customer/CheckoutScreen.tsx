import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useOrderStore } from '@/stores/orderStore';
import { getLocalizedName } from '@/utils/i18nHelper';
import { ChevronLeft, CreditCard, Banknote, Globe, Check, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const paymentMethods = [
  { id: 'cash', icon: Banknote, label: 'checkout.cash' },
  { id: 'card', icon: CreditCard, label: 'checkout.card' },
  { id: 'online', icon: Globe, label: 'checkout.online' },
] as const;

export function CheckoutScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const { items, subtotal, serviceFee, discount, total, clearCart } = useCartStore();
  const session = useSessionStore((state) => state.session);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [specialRequest, setSpecialRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        tableId: session.tableId,
        branchId: session.branchId,
        fulfillmentType: 'dine_in',
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedSizeId: item.selectedSize?.id,
          selectedExtras: item.selectedExtras.map((e) => e.id),
          specialNote: item.specialNote,
        })),
        paymentMethod,
        specialRequest: specialRequest || undefined,
        discountCode: undefined,
      };
      await placeOrder(orderData);
      clearCart();
      setScreen('order-success');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('cart')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('checkout.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Order Summary */}
        <div>
          <h2 className="font-semibold mb-3">{t('checkout.orderSummary')}</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground-muted">
                  {item.quantity}x {getLocalizedName(item.product)}
                </span>
                <span>${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">{t('cart.subtotal')}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">{t('cart.serviceFee')}</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-success-500">
                <span>{t('cart.discount')}</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>{t('cart.total')}</span>
              <span className="text-primary-500">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="font-semibold mb-3">{t('checkout.paymentMethod')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    paymentMethod === method.id
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-border bg-surface-elevated hover:border-primary-500/30"
                  )}
                >
                  <Icon className={cn("w-6 h-6", paymentMethod === method.id ? "text-primary-500" : "text-foreground-muted")} />
                  <span className={cn("text-xs font-medium", paymentMethod === method.id ? "text-primary-500" : "text-foreground-muted")}>
                    {t(method.label)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Special Request */}
        <div>
          <h2 className="font-semibold mb-3">{t('checkout.specialRequest')}</h2>
          <textarea
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            placeholder={t('checkout.specialRequest')}
            className="w-full p-3 bg-surface-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-primary-500 min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Place Order */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-border p-4 safe-bottom z-40">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full max-w-lg mx-auto block py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {t('checkout.placeOrder')} — ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
