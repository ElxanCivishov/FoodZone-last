import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Check } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { Product, ProductSize, ProductExtra } from '@/types';

const DEMO_PRODUCT: Product = {
  id: '1', categoryId: '1', name: 'Pepperoni Pizza', nameAz: 'Pepperoni Pizza', nameEn: 'Pepperoni Pizza',
  nameRu: 'Пепперони Пицца', nameTr: 'Pepperoni Pizza',
  description: 'Classic pepperoni pizza with mozzarella cheese and tomato sauce',
  descriptionAz: 'Klassik pepperoni pizza mozzarella pendiri və pomidor sousu ilə',
  price: 14.90, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600',
  sortOrder: 1, status: 'active', isPopular: true, hasExtras: true, hasSizes: true,
  sizes: [
    { id: 's1', productId: '1', name: 'Small', nameAz: 'Kiçik', nameEn: 'Small', priceModifier: 0, isDefault: true },
    { id: 's2', productId: '1', name: 'Medium', nameAz: 'Orta', nameEn: 'Medium', priceModifier: 3, isDefault: false },
    { id: 's3', productId: '1', name: 'Large', nameAz: 'Böyük', nameEn: 'Large', priceModifier: 6, isDefault: false },
  ],
  extras: [
    { id: 'e1', productId: '1', name: 'Extra Cheese', nameAz: 'Əlavə pendir', nameEn: 'Extra Cheese', price: 2 },
    { id: 'e2', productId: '1', name: 'Mushrooms', nameAz: 'Göbələk', nameEn: 'Mushrooms', price: 1.5 },
    { id: 'e3', productId: '1', name: 'Olives', nameAz: 'Zeytun', nameEn: 'Olives', price: 1 },
  ],
  createdAt: new Date().toISOString(),
};

export function ProductDetailScreen() {
  const setScreen = useUIStore((s) => s.setScreen);
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(DEMO_PRODUCT.sizes?.find((s) => s.isDefault) || DEMO_PRODUCT.sizes?.[0]);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [specialNote, setSpecialNote] = useState('');
  const [added, setAdded] = useState(false);

  const basePrice = DEMO_PRODUCT.price + (selectedSize?.priceModifier || 0);
  const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = basePrice + extrasPrice;
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras((prev) => prev.find((e) => e.id === extra.id) ? prev.filter((e) => e.id !== extra.id) : [...prev, extra]);
  };

  const handleAddToCart = () => {
    addItem({ productId: DEMO_PRODUCT.id, product: DEMO_PRODUCT, quantity, selectedSize, selectedExtras, specialNote: specialNote || undefined, unitPrice });
    setAdded(true);
    setTimeout(() => { setAdded(false); setScreen('home'); }, 1000);
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <div className="relative aspect-square bg-dark-800">
        <img src={DEMO_PRODUCT.image} alt={DEMO_PRODUCT.name} className="w-full h-full object-cover" />
        <button onClick={() => setScreen('home')} className="absolute top-4 left-4 w-10 h-10 bg-dark-900/80 backdrop-blur rounded-xl flex items-center justify-center text-white">
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-2">{DEMO_PRODUCT.name}</h1>
        <p className="text-dark-400 mb-6">{DEMO_PRODUCT.description}</p>
        {DEMO_PRODUCT.hasSizes && DEMO_PRODUCT.sizes && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Size</h3>
            <div className="flex gap-3">
              {DEMO_PRODUCT.sizes.map((size) => (
                <button key={size.id} onClick={() => setSelectedSize(size)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${selectedSize?.id === size.id ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 border border-dark-700'}`}>
                  {size.name}
                  {size.priceModifier > 0 && <span className="block text-xs mt-1 opacity-80">+${size.priceModifier}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {DEMO_PRODUCT.hasExtras && DEMO_PRODUCT.extras && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Extras</h3>
            <div className="space-y-2">
              {DEMO_PRODUCT.extras.map((extra) => {
                const isSelected = selectedExtras.find((e) => e.id === extra.id);
                return (
                  <button key={extra.id} onClick={() => toggleExtra(extra)} className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${isSelected ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-dark-800 border border-dark-700'}`}>
                    <span className={isSelected ? 'text-white' : 'text-dark-300'}>{extra.name}</span>
                    <span className="text-primary-400 font-medium">+${extra.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3">Special Request</h3>
          <textarea value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} placeholder="Any special requests..." className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none h-24" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">Quantity</h3>
          <div className="flex items-center gap-4">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-white"><Minus size={18} /></button>
            <span className="text-white font-bold text-lg w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-white"><Plus size={18} /></button>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-xl border-t border-dark-700 p-4 z-40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-dark-400">Total</span>
          <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
        </div>
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddToCart} disabled={added} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg">
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2"><Check size={20} /> Added!</motion.span>
            ) : (
              <motion.span key="add" className="flex items-center gap-2">Add to Cart <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">${totalPrice.toFixed(2)}</span></motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
