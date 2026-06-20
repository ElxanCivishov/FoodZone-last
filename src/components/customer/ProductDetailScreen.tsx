import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { getLocalizedName, getLocalizedDescription } from '@/utils/i18nHelper';
import { ChevronLeft, Plus, Minus, Star, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function ProductDetailScreen() {
  const { t } = useTranslation();
  const setScreen = useUIStore((state) => state.setScreen);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [specialNote, setSpecialNote] = useState('');

  const product = useMemo(() => {
    const raw = localStorage.getItem('fz_selected_product');
    return raw ? JSON.parse(raw) : null;
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => setScreen('home')} className="text-primary-500">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const unitPrice = useMemo(() => {
    let price = product.price;
    if (selectedSize) price += selectedSize.priceModifier;
    const extrasPrice = product.extras
      ?.filter((e: any) => selectedExtras.includes(e.id))
      .reduce((sum: number, e: any) => sum + e.price, 0) || 0;
    return price + extrasPrice;
  }, [product, selectedSize, selectedExtras]);

  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    const extras = product.extras?.filter((e: any) => selectedExtras.includes(e.id)) || [];
    addItem({
      productId: product.id,
      product,
      quantity,
      selectedSize,
      selectedExtras: extras,
      specialNote: specialNote || undefined,
      unitPrice,
    });
    toast.success(t('product.addToCart'));
    setScreen('home');
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header Image */}
      <div className="relative h-72 bg-foreground-muted/5">
        {product.image ? (
          <img src={product.image} alt={getLocalizedName(product)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Star className="w-16 h-16 text-foreground-muted/20" />
          </div>
        )}
        <button
          onClick={() => setScreen('home')}
          className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{getLocalizedName(product)}</h1>
          <p className="text-foreground-muted mt-1">{getLocalizedDescription(product)}</p>
          <p className="text-2xl font-bold text-primary-500 mt-3">${unitPrice.toFixed(2)}</p>
        </div>

        {/* Sizes */}
        {product.hasSizes && product.sizes?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{t('product.size')}</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size: any) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(selectedSize?.id === size.id ? null : size)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                    selectedSize?.id === size.id
                      ? "border-primary-500 bg-primary-500/10 text-primary-500"
                      : "border-border bg-surface-elevated hover:border-primary-500/30"
                  )}
                >
                  {getLocalizedName(size)}
                  {size.priceModifier > 0 && (
                    <span className="ml-1 text-foreground-muted">+${size.priceModifier.toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Extras */}
        {product.hasExtras && product.extras?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{t('product.extras')}</h3>
            <div className="space-y-2">
              {product.extras.map((extra: any) => (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border transition-colors",
                    selectedExtras.includes(extra.id)
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-border bg-surface-elevated"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      selectedExtras.includes(extra.id)
                        ? "bg-primary-500 border-primary-500"
                        : "border-foreground-muted"
                    )}>
                      {selectedExtras.includes(extra.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm">{getLocalizedName(extra)}</span>
                  </div>
                  <span className="text-sm font-medium">+${extra.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special Note */}
        <div>
          <h3 className="font-semibold mb-2">{t('product.specialNote')}</h3>
          <textarea
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder={t('product.specialNote')}
            className="w-full p-3 bg-surface-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-primary-500 min-h-[80px] resize-none"
          />
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t('product.quantity')}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-border p-4 safe-bottom z-40">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground-muted">{t('cart.total')}</p>
            <p className="text-xl font-bold text-primary-500">${totalPrice.toFixed(2)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors active:scale-[0.98]"
          >
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}
