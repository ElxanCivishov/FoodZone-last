import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { del, patch, post } from '@/services/api';
import type { Category, OrderStatus, Product } from '@/types';

export function useProductMutations(branchId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return {
    createProduct: useMutation({
      mutationFn: (data: Record<string, unknown>) => post<Product>(`/branches/${branchId}/products`, data),
      onSuccess: () => {
        refresh();
        toast.success('Product added');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    updateProduct: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => patch<Product>(`/branches/products/${id}`, data),
      onSuccess: () => {
        refresh();
        toast.success('Product updated');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    deleteProduct: useMutation({
      mutationFn: (id: string) => del(`/branches/products/${id}`),
      onSuccess: () => {
        refresh();
        toast.success('Product deleted');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
  };
}

export function useCategoryMutations(branchId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return {
    createCategory: useMutation({
      mutationFn: (data: Record<string, unknown>) => post<Category>(`/branches/${branchId}/categories`, data),
      onSuccess: () => {
        refresh();
        toast.success('Category added');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => patch<Category>(`/branches/categories/${id}`, data),
      onSuccess: () => {
        refresh();
        toast.success('Category updated');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    deleteCategory: useMutation({
      mutationFn: (id: string) => del(`/branches/categories/${id}`),
      onSuccess: () => {
        refresh();
        toast.success('Category deleted');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    reorderCategories: useMutation({
      mutationFn: (ids: string[]) => patch<Category[]>(`/branches/${branchId}/categories/reorder`, { ids }),
      onSuccess: () => {
        refresh();
      },
      onError: (err: Error) => toast.error(err.message),
    }),
  };
}

export function useOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) => patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Order updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useQrMutations() {
  const queryClient = useQueryClient();

  return {
    generateQr: useMutation({
      mutationFn: (id: string) => post(`/qr/tables/${id}/generate`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        toast.success('QR generated');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    updateTable: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/qr/tables/${id}`, { status }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        toast.success('Table updated');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
  };
}

export function useStaffMutations() {
  const queryClient = useQueryClient();

  return {
    createStaff: useMutation({
      mutationFn: (data: Record<string, unknown>) => post('/staff', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        toast.success('Staff added');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    updateStaff: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => patch(`/staff/${id}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        toast.success('Staff updated');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
    deleteStaff: useMutation({
      mutationFn: (id: string) => del(`/staff/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        toast.success('Staff deleted');
      },
      onError: (err: Error) => toast.error(err.message),
    }),
  };
}
