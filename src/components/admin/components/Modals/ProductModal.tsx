import type { FormEvent } from 'react';
import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Category, Product } from '@/types';
import { getLocalizedName } from '@/utils/i18nHelper';
import { AppSelect } from '../AppSelect';

interface ProductModalProps {
  open: boolean;
  product?: Product;
  categories: Category[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function ProductModal({ open, product, categories, loading = false, onClose, onSubmit }: ProductModalProps) {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const formData = new FormData(event.currentTarget);
    onSubmit({
      name: formData.get('name'),
      categoryId: formData.get('categoryId'),
      price: Number(formData.get('price')),
      isPopular: formData.get('isPopular') === 'on',
    });
  };
  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="relative w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-4 shadow-xl">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label={t('common.close')}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
          <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-4">
            <DialogTitle className="pr-8 font-semibold">{product ? 'Edit product' : 'Add product'}</DialogTitle>
            <fieldset disabled={loading} className="space-y-4 disabled:opacity-70">
              <input name="name" defaultValue={product?.name} required placeholder="Name" className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm disabled:cursor-not-allowed" />
              <input type="hidden" name="categoryId" value={categoryId} />
              <AppSelect
                value={categoryId}
                onChange={setCategoryId}
                options={categories.map(c => ({ value: c.id, label: getLocalizedName(c) }))}
                disabled={loading}
              />
              <input name="price" type="number" min="0" step="0.01" defaultValue={product?.price || 10} required className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm disabled:cursor-not-allowed" />
              <label className="flex items-center gap-2 text-sm">
                <input name="isPopular" type="checkbox" defaultChecked={product?.isPopular} />
                Popular
              </label>
            </fieldset>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={loading} onClick={handleClose} className="px-3 py-2 rounded-xl text-sm font-medium bg-foreground-muted/10 disabled:cursor-not-allowed disabled:opacity-60">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white disabled:cursor-not-allowed disabled:opacity-70">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
