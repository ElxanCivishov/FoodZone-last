import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { Branch, Category, Product } from '@/types';

export function useBranch(branchId: string) {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => get<Branch>(`/branches/${branchId}`),
    enabled: !!branchId,
  });
}

export function useCategories(branchId: string) {
  return useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => get<Category[]>(`/branches/${branchId}/categories`),
    enabled: !!branchId,
  });
}

export function useProducts(branchId: string, categoryId?: string) {
  return useQuery({
    queryKey: ['products', branchId, categoryId],
    queryFn: () => get<Product[]>(`/branches/${branchId}/products`, categoryId ? { categoryId } : undefined),
    enabled: !!branchId,
  });
}

export function usePopularProducts(branchId: string) {
  return useQuery({
    queryKey: ['products', 'popular', branchId],
    queryFn: () => get<Product[]>(`/branches/${branchId}/products/popular`),
    enabled: !!branchId,
  });
}
