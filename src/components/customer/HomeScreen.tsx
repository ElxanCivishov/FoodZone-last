import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { useBranch, useCategories, useProducts, usePopularProducts } from '@/hooks/useMenu';
import { getLocalizedName, getLocalizedDescription } from '@/utils/i18nHelper';
import { Search, ChevronRight, Star, ShoppingBag, Flame } from 'lucide-react';
import { Skeleton } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

export function HomeScreen() {
  const { t } = useTranslation();
  const session = useSessionStore((state) => state.session);
  const setScreen = useUIStore((state) => state.setScreen);
  const itemCount = useCartStore((state) => state.itemCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const branchId = session?.branchId || '';
  const { data: branchData } = useBranch(branchId);
  const { data: categories, isLoading: catLoading } = useCategories(branchId);
  const { data: products, isLoading: prodLoading } = useProducts(branchId, selectedCategory || undefined);
  const { data: popularProducts } = usePopularProducts(branchId);

  const filteredProducts = useMemo(() => {
    if (!products?.data) return [];
    if (!searchQuery) return products.data;
    const q = searchQuery.toLowerCase();
    return products.data.filter((p: any) =>
      getLocalizedName(p).toLowerCase().includes(q) ||
      getLocalizedDescription(p).toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const handleProductClick = (product: any) => {
    useUIStore.setState({ currentScreen: 'product-detail' });
    // Store selected product in a temporary state or pass via URL
    // For simplicity, we'll use a global store approach or localStorage
    localStorage.setItem('fz_selected_product', JSON.stringify(product));
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="font-bold text-lg truncate">
              {(branchData?.data as any)?.restaurant?.name || branchData?.data?.name || 'FoodZone'}
            </h1>
            <p className="text-xs text-foreground-muted">
              {t('waiter.table')} {session?.tableNumber}
            </p>
          </div>
          <button
            onClick={() => setScreen('cart')}
            className="relative p-2 rounded-xl bg-surface-elevated border border-border"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.search')}
              className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Categories */}
        {!searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{t('home.categories')}</h2>
            </div>
            {catLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="w-24 h-10 flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    !selectedCategory
                      ? "bg-primary-500 text-white"
                      : "bg-surface-elevated border border-border text-foreground-muted hover:text-foreground"
                  )}
                >
                  {t('home.all')}
                </button>
                {categories?.data?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      selectedCategory === cat.id
                        ? "bg-primary-500 text-white"
                        : "bg-surface-elevated border border-border text-foreground-muted hover:text-foreground"
                    )}
                  >
                    {getLocalizedName(cat)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular */}
        {!searchQuery && !selectedCategory && (popularProducts?.data?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary-500" />
                {t('home.popular')}
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
              {(popularProducts?.data ?? []).map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="flex-shrink-0 w-36 text-left"
                >
                  <div className="w-36 h-36 rounded-2xl bg-surface-elevated border border-border overflow-hidden mb-2">
                    {product.image ? (
                      <img src={product.image} alt={getLocalizedName(product)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-foreground-muted/5">
                        <Star className="w-8 h-8 text-foreground-muted/20" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{getLocalizedName(product)}</p>
                  <p className="text-sm text-primary-500 font-semibold">${product.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div>
          <h2 className="font-semibold mb-3">
            {selectedCategory
              ? getLocalizedName(categories?.data?.find((c: any) => c.id === selectedCategory))
              : t('home.menu')}
          </h2>
          {prodLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-20 h-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full flex gap-3 p-3 bg-surface-elevated border border-border rounded-2xl text-left hover:border-primary-500/30 transition-colors"
                >
                  <div className="w-20 h-20 rounded-xl bg-foreground-muted/5 flex-shrink-0 overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={getLocalizedName(product)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-foreground-muted/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{getLocalizedName(product)}</h3>
                    <p className="text-sm text-foreground-muted line-clamp-2 mt-0.5">
                      {getLocalizedDescription(product)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-primary-500">${product.price.toFixed(2)}</span>
                      {product.hasSizes && (
                        <span className="text-xs text-foreground-muted bg-foreground-muted/10 px-2 py-0.5 rounded-full">
                          {t('product.size')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground-muted self-center" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
