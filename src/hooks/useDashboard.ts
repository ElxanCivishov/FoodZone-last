import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { DashboardStats, Order, WaiterRequest } from '@/types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => get<DashboardStats>('/dashboard/stats'),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useOrdersByStatus() {
  return useQuery({
    queryKey: ['orders', 'by-status'],
    queryFn: () => get<{ status: string; count: number }[]>('/dashboard/orders-by-status'),
    refetchInterval: 15000,
  });
}

export function useOrders(
  params?: { status?: string; limit?: number; offset?: number },
  options?: { refetchInterval?: number; staleTime?: number }
) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => get<Order[]>('/orders', params),
    refetchInterval: options?.refetchInterval ?? 10000,
    staleTime: options?.staleTime,
  });
}

export function useWaiterRequests(status?: string) {
  return useQuery({
    queryKey: ['waiter-requests', status],
    queryFn: () => get<WaiterRequest[]>('/waiter-requests', status ? { status } : undefined),
    refetchInterval: 5000,
  });
}
