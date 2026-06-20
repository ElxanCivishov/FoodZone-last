import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { Minus, Plus, ShoppingCart } from 'lucide-react';

export function ProductDetailScreen() {
  const { addItem } = useCartStore();
  const { setScreen } = useUIStore();
  const [quantity, setQuantity] = useState(1);

  // Demo product - in real app, fetch by ID
  const product = {
    id: 'demo-product',
    name: 'Demo Product',
    nameAz: 'Demo Məhsul',
    price: 12.99,
    description: 'Delicious demo product description',
    hasSizes: false,
    hasExtras: false,
    sizes: [] as any[],
    extras: [] as any[],
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      product: product as any,
      quantity,
      selectedSize: undefined,
      selectedExtras: [],
      unitPrice: product.price,
    });
    setScreen('cart');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="h-64 bg-dark-700" />
      <div className="p-4 -mt-8">
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-dark-400 mb-4">{product.description}</p>
          <p className="text-3xl font-bold text-primary-400 mb-6">${product.price.toFixed(2)}</p>

          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-primary-500 hover:bg-primary-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart - ${(product.price * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
