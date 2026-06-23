import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Edit, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { get } from '@/services/api';
import type { Category, Product } from '@/types';
import { getLocalizedName } from '@/utils/i18nHelper';
import { DataTable, Td, Th } from '../components/DataTable';
import { IconButton } from '../components/IconButton';
import { SectionTitle } from '../components/SectionTitle';
import { StatusPill } from '../components/StatusPill';
import { useActiveBranchId } from '../hooks/useActiveBranch';
import { useProductMutations } from '../hooks/useAdminMutations';

export function MenuView() {
  const { t } = useTranslation();
  const branchId = useActiveBranchId();
  const { data: categories } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => get<Category[]>(`/branches/${branchId}/categories`),
    enabled: !!branchId,
  });
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', branchId],
    queryFn: () => get<Product[]>(`/branches/${branchId}/products`),
    enabled: !!branchId,
  });
  const { createProduct, updateProduct, deleteProduct } = useProductMutations(branchId);

  const addProduct = () => {
    const categoryId = categories?.data?.[0]?.id;
    if (!categoryId) return toast.error('Create a category first');

    const name = window.prompt('Product name');
    if (!name) return;

    const price = Number(window.prompt('Price', '10'));
    if (!Number.isFinite(price)) return toast.error('Invalid price');

    createProduct.mutate({ categoryId, name, price, isPopular: false });
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('admin.menu')}
        action={
          <button onClick={addProduct} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />
            {t('admin.add')}
          </button>
        }
      />
      <DataTable loading={isLoading} colSpan={6}>
        <thead className="bg-foreground-muted/5">
          <tr>
            <Th>{t('admin.name')}</Th>
            <Th>{t('admin.category')}</Th>
            <Th>{t('admin.price')}</Th>
            <Th>{t('admin.status')}</Th>
            <Th>Popular</Th>
            <Th right>{t('admin.actions')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(products?.data || []).map((product) => (
            <tr key={product.id} className="hover:bg-foreground-muted/5">
              <Td className="font-medium">{product.name}</Td>
              <Td muted>{getLocalizedName(product.category)}</Td>
              <Td>${product.price.toFixed(2)}</Td>
              <Td>
                <StatusPill status={product.status} />
              </Td>
              <Td>{product.isPopular ? <CheckCircle2 className="w-4 h-4 text-success-500" /> : <XCircle className="w-4 h-4 text-foreground-muted" />}</Td>
              <Td right>
                <IconButton
                  title="Rename"
                  onClick={() => {
                    const name = window.prompt('Product name', product.name);
                    if (name) updateProduct.mutate({ id: product.id, data: { name, nameAz: name, nameEn: name, nameRu: name, nameTr: name } });
                  }}
                >
                  <Edit className="w-4 h-4" />
                </IconButton>
                <IconButton title="Toggle status" onClick={() => updateProduct.mutate({ id: product.id, data: { status: product.status === 'active' ? 'inactive' : 'active' } })}>
                  <RefreshCw className="w-4 h-4" />
                </IconButton>
                <IconButton danger title="Delete" onClick={() => window.confirm('Delete product?') && deleteProduct.mutate(product.id)}>
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
