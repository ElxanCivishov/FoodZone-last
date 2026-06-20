import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Wifi } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { get } from '@/services/api';
import { Product, Category } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const session = useSessionStore((s) => s.session);
  const itemCount = useCartStore((s) => s.itemCount);
  const setScreen = useUIStore((s) => s.setScreen);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', session?.branchId],
    queryFn: () => get<Category[]>(`/branches/${session?.branchId}/categories`),
    enabled: !!session?.branchId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', session?.branchId],
    queryFn: () => get<Product[]>(`/branches/${session?.branchId}/products`),
    enabled: !!session?.branchId,
  });

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.nameAz?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const popularProducts = products.filter((p) => p.isPopular);

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">FoodZone</h1>
            <p className="text-dark-400 text-sm">Table {session?.tableNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('wifi-connect')} className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-dark-400 hover:text-white transition-colors">
              <Wifi size={20} />
            </button>
            <button onClick={() => setScreen('cart')} className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-dark-400 hover:text-white transition-colors relative">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-xs flex items-center justify-center text-white font-bold">{itemCount}</span>
              )}
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" placeholder="Search dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500" />
          </div>
        </div>
      </div>
      {!searchQuery && (
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-white mb-3">Categories</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => setSelectedCategory(null)} className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${selectedCategory === null ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'}`}>All</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'}`}>
                {cat.icon && <span>{cat.icon}</span>}{cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {!searchQuery && !selectedCategory && popularProducts.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Popular</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {popularProducts.map((product) => <ProductCard key={product.id} product={product} compact />)}
          </div>
        </div>
      )}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-white mb-3">{selectedCategory ? 'Menu' : 'All Dishes'}</h2>
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const setScreen = useUIStore((s) => s.setScreen);
  if (compact) {
    return (
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setScreen('product-detail')} className="flex-shrink-0 w-40 bg-dark-800 rounded-2xl overflow-hidden border border-dark-700">
        <div className="aspect-square bg-dark-700 relative">
          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-dark-500"><span className="text-4xl">🍽️</span></div>}
        </div>
        <div className="p-3">
          <h3 className="text-white font-medium text-sm truncate">{product.name}</h3>
          <p className="text-primary-400 font-bold text-sm">${product.price.toFixed(2)}</p>
        </div>
      </motion.button>
    );
  }
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setScreen('product-detail')} className="bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 text-left">
      <div className="aspect-[4/3] bg-dark-700 relative">
        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-dark-500"><span className="text-5xl">🍽️</span></div>}
        {product.isPopular && <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-lg">Popular</span>}
      </div>
      <div className="p-3">
        <h3 className="text-white font-medium text-sm line-clamp-2">{product.name}</h3>
        <p className="text-dark-400 text-xs mt-1 line-clamp-1">{product.description}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-primary-400 font-bold">${product.price.toFixed(2)}</p>
          <span className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center text-white">+</span>
        </div>
      </div>
    </motion.button>
  );
}
