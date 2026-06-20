import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { getLocalizedName } from '@/utils/i18nHelper';
import { ChevronLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
export function CartScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const { items, subtotal, serviceFee, discount, total, updateQuantity, removeItem } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-foreground-muted/5 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-foreground-muted" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('cart.empty')}</h2>
        <p className="text-foreground-muted mb-6">Add some delicious items!</p>
        <button
          onClick={() => setScreen('home')}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          {t('home.menu')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-40">
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')} className="p-2 -ml-2 rounded-lg hover:bg-foreground-muted/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('cart.title')}</h1>
          <span className="text-sm text-foreground-muted">({t('cart.itemCount', { count: items.length })})</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 p-3 bg-surface-elevated border border-border rounded-2xl">
            <div className="w-16 h-16 rounded-xl bg-foreground-muted/5 flex-shrink-0 overflow-hidden">
              {item.product.image ? (
                <img src={item.product.image} alt={getLocalizedName(item.product)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-foreground-muted/20" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{getLocalizedName(item.product)}</h3>
              {item.selectedSize && (
                <p className="text-xs text-foreground-muted">{getLocalizedName(item.selectedSize)}</p>
              )}
              {item.selectedExtras.length > 0 && (
                <p className="text-xs text-foreground-muted truncate">
                  + {item.selectedExtras.map((e) => getLocalizedName(e)).join(', ')}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-foreground-muted/10 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-foreground-muted/10 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-semibold text-sm">${item.totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-foreground-muted hover:text-danger-500 self-start"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Summary */}
        <div className="p-4 bg-surface-elevated border border-border rounded-2xl space-y-2">
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
          <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
            <span>{t('cart.total')}</span>
            <span className="text-primary-500">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-border p-4 safe-bottom z-40">
        <button
          onClick={() => setScreen('checkout')}
          className="w-full max-w-lg mx-auto block py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors active:scale-[0.98]"
        >
          {t('cart.checkout')} — ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
