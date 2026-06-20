import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';

export function CartScreen() {
  const setScreen = useUIStore((s) => s.setScreen);
  const { items, subtotal, serviceFee, discount, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 bg-dark-800 rounded-3xl flex items-center justify-center mx-auto mb-6"><span className="text-5xl">🛒</span></div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
          <p className="text-dark-400 mb-6">Add some delicious items to get started</p>
          <button onClick={() => setScreen('home')} className="btn-primary">Browse Menu</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-40">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => setScreen('home')} className="text-dark-400 hover:text-white"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-white">Cart ({itemCount})</h1>
        <button onClick={clearCart} className="ml-auto text-red-400 text-sm">Clear</button>
      </div>
      <div className="px-4 py-4 space-y-4">
        {items.map((item) => (
          <motion.div key={item.id} layout className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-dark-700 rounded-xl flex-shrink-0 overflow-hidden">
                {item.product.image ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{item.product.name}</h3>
                {item.selectedSize && <p className="text-dark-400 text-xs mt-1">Size: {item.selectedSize.name}</p>}
                {item.selectedExtras.length > 0 && <p className="text-dark-400 text-xs">+{item.selectedExtras.map((e) => e.name).join(', ')}</p>}
                {item.specialNote && <p className="text-primary-400 text-xs mt-1">Note: {item.specialNote}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary-400 font-bold">${item.totalPrice.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-white"><Minus size={14} /></button>
                    <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-white"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 self-start"><Trash2 size={18} /></button>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="px-4 py-4 bg-dark-800/50 border-t border-dark-800">
        <div className="space-y-2">
          <div className="flex justify-between text-dark-300"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-dark-300"><span>Service Fee (5%)</span><span>${serviceFee.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-dark-700"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-xl border-t border-dark-700 p-4 z-40">
        <button onClick={() => setScreen('checkout')} className="w-full btn-primary py-4 text-lg flex items-center justify-between px-6">
          <span>Proceed to Checkout</span><span className="bg-white/20 px-3 py-1 rounded-lg">${total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
