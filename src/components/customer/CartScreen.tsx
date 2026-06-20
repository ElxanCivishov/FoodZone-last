import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { Minus, Plus, Trash2 } from 'lucide-react';

export function CartScreen() {
  const { items, subtotal, serviceFee, discount, total, updateQuantity, removeItem, clearCart } = useCartStore();
  const { setScreen } = useUIStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
        <span className="text-5xl mb-4">🛒</span>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-dark-400 mb-6">Add some delicious items!</p>
        <button onClick={() => setScreen('home')} className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-xl font-medium">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="bg-dark-800 rounded-xl border border-dark-700 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium">{item.product.name}</h3>
                {item.selectedSize && <p className="text-sm text-dark-400">{item.selectedSize.name}</p>}
                {item.selectedExtras.length > 0 && (
                  <p className="text-sm text-dark-400">+ {item.selectedExtras.map(e => e.name).join(', ')}</p>
                )}
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-400 p-1">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-dark-900 rounded-lg px-3 py-1">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-dark-400">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-primary-400">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="font-bold">${item.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-dark-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-dark-400">
            <span>Service Fee</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-dark-700">
            <span>Total</span>
            <span className="text-primary-400">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-4 right-4 flex gap-3">
        <button onClick={clearCart} className="flex-1 bg-dark-800 hover:bg-dark-700 py-3 rounded-xl font-medium">
          Clear
        </button>
        <button onClick={() => setScreen('checkout')} className="flex-[2] bg-primary-500 hover:bg-primary-600 py-3 rounded-xl font-bold">
          Checkout ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
