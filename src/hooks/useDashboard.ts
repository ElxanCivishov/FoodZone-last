import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => get('/dashboard/stats'),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useOrdersByStatus() {
  return useQuery({
    queryKey: ['orders', 'by-status'],
    queryFn: () => get('/dashboard/orders-by-status'),
    refetchInterval: 15000,
  });
}

export function useOrders(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => get('/orders', params),
    refetchInterval: 10000,
  });
}

export function useWaiterRequests(status?: string) {
  return useQuery({
    queryKey: ['waiter-requests', status],
    queryFn: () => get('/waiter-requests', status ? { status } : undefined),
    refetchInterval: 5000,
  });
}
