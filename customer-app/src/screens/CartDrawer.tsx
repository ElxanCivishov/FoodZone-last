import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useUIStore, useCartStore, useOrderStore } from '@/store';
import { generateOrderId, getCurrentTime } from '@/utils';

const SPRING = { type: 'spring' as const, stiffness: 350, damping: 30 };

export default function CartDrawer() {
  const { cartDrawerOpen, closeCartDrawer, setScreen, addToast } = useUIStore();
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getServiceFee, getTotal } =
    useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);
  const [placing, setPlacing] = useState(false);

  const subtotal = getSubtotal();
  const fee = getServiceFee();
  const total = getTotal();

  const handleCheckout = () => {
    closeCartDrawer();
    setScreen('checkout');
  };

  const handleQuickOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      addOrder({
        id: generateOrderId(),
        items: [...items],
        status: 'new',
        subtotal,
        serviceFee: fee,
        discount: 0,
        total,
        tableNumber: 12,
        createdAt: getCurrentTime(),
        estimatedTime: 18,
      });
      clearCart();
      closeCartDrawer();
      addToast('Sifarişiniz qəbul edildi!', 'success');
      setScreen('tracking');
      setPlacing(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCartDrawer}
            className="absolute inset-0 z-[200] modal-backdrop"
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={SPRING}
            className="absolute bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl max-h-[85%] flex flex-col shadow-modal"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
              <h2 className="font-outfit text-[18px] font-bold text-text-primary">Səbətim</h2>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={closeCartDrawer}
                className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
              >
                <X size={16} className="text-text-secondary" />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mb-4">
                    <ShoppingBag size={36} className="text-primary" />
                  </div>
                  <p className="font-outfit text-[17px] font-bold text-text-primary">Səbət boşdur</p>
                  <p className="text-text-secondary text-[13px] mt-1 text-center">
                    Menyu bölməsindən əlavə edin
                  </p>
                  <button
                    onClick={closeCartDrawer}
                    className="mt-4 text-primary text-[13px] font-semibold"
                  >
                    Menyuya keç
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <motion.div
                        key={`${item.product.id}-${item.selectedSize.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: i * 0.04, ...SPRING }}
                        className="flex gap-3 py-3.5 border-b border-border-light last:border-0"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {item.selectedSize.label}
                            {item.selectedExtras.length > 0 &&
                              ` • ${item.selectedExtras.map((e) => e.label).join(', ')}`}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center"
                              >
                                <Minus size={11} />
                              </motion.button>
                              <span className="text-[13px] font-bold min-w-[18px] text-center">
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center"
                              >
                                <Plus size={11} />
                              </motion.button>
                            </div>
                            <span className="text-primary font-outfit text-[13px] font-bold">
                              {(item.unitPrice * item.quantity).toFixed(2)} AZN
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => removeItem(item.product.id)}
                          className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center self-start shrink-0 mt-0.5"
                        >
                          <Trash2 size={12} className="text-coral" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Summary + CTA */}
            {items.length > 0 && (
              <div className="border-t border-border-light">
                {/* Summary */}
                <div className="mx-4 mt-3 p-4 bg-surface-elevated rounded-xl">
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="text-text-secondary">Ara cəmi</span>
                    <span className="font-medium text-text-primary">{subtotal.toFixed(2)} AZN</span>
                  </div>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-text-secondary">Xidmət haqqı (10%)</span>
                    <span className="text-text-secondary">{fee.toFixed(2)} AZN</span>
                  </div>
                  <div className="flex justify-between border-t border-border-light pt-2">
                    <span className="font-outfit text-[15px] font-bold text-text-primary">Ümumi</span>
                    <span className="font-outfit text-[15px] font-bold text-primary">
                      {total.toFixed(2)} AZN
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="px-4 pt-3 pb-6 flex flex-col gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckout}
                    className="w-full py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-primary-glow"
                    style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
                  >
                    Ödənişə keç <ArrowRight size={18} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleQuickOrder}
                    disabled={placing}
                    className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-primary border-2 border-primary/30 bg-primary-light"
                  >
                    {placing ? 'Sifariş verilir…' : 'Tez sifariş ver (masaya)'}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
