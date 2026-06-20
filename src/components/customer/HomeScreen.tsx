import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { useBranch, useCategories, useProducts, usePopularProducts } from '@/hooks/useMenu';
import { Search } from 'lucide-react';

export function HomeScreen() {
  const { session } = useSessionStore();
  const setScreen = useUIStore((s) => s.setScreen);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const branchId = session?.branchId || '';
  const { data: branchData } = useBranch(branchId);
  const { data: categoriesData } = useCategories(branchId);
  const { data: productsData } = useProducts(branchId, selectedCategory || undefined);
  const { data: popularData } = usePopularProducts(branchId);

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];
  const popularProducts = popularData?.data || [];

  const filteredProducts = searchQuery
    ? products.filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameAz?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-24">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{branchData?.data?.restaurant?.name || 'FoodZone'}</h1>
            <p className="text-sm text-dark-400">Table {session?.tableNumber}</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
        </div>

        {!searchQuery && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Categories</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${!selectedCategory ? 'bg-primary-500' : 'bg-dark-800'}`}
                >
                  All
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${selectedCategory === cat.id ? 'bg-primary-500' : 'bg-dark-800'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {popularProducts.length > 0 && !selectedCategory && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Popular</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {popularProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">{selectedCategory ? 'Menu' : 'All Dishes'}</h2>
          <div className="space-y-3">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, compact }: { product: any; compact?: boolean }) {
  const setScreen = useUIStore((s) => s.setScreen);

  if (compact) {
    return (
      <div 
        onClick={() => setScreen('product-detail')}
        className="min-w-[140px] bg-dark-800 rounded-xl p-3 cursor-pointer"
      >
        <div className="w-full h-24 bg-dark-700 rounded-lg mb-2" />
        <p className="font-medium text-sm truncate">{product.name}</p>
        <p className="text-primary-400 text-sm">${product.price.toFixed(2)}</p>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setScreen('product-detail')}
      className="flex gap-4 bg-dark-800 rounded-xl p-4 cursor-pointer hover:bg-dark-700 transition-colors"
    >
      <div className="w-20 h-20 bg-dark-700 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-sm text-dark-400 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary-400 font-bold">${product.price.toFixed(2)}</span>
          {product.hasSizes && <span className="text-xs text-dark-400">Multiple sizes</span>}
        </div>
      </div>
    </div>
  );
}
