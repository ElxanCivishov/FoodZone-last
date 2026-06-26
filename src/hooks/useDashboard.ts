import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api';
import { DashboardStats, Order, WaiterRequest } from '@/types';

type DashboardQueryOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
  staleTime?: number;
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => get<DashboardStats>('/dashboard/stats'),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useOrdersByStatus(options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: ['orders', 'by-status'],
    queryFn: () => get<{ status: string; count: number }[]>('/dashboard/orders-by-status'),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval ?? 15000,
    staleTime: options?.staleTime,
  });
}

export function useOrders(
  params?: { status?: string; fulfillmentType?: string; limit?: number; offset?: number },
  options?: { refetchInterval?: number; staleTime?: number }
) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => get<Order[]>('/orders', params),
    refetchInterval: options?.refetchInterval ?? 10000,
    staleTime: options?.staleTime,
  });
}

export function useWaiterRequests(status?: string, options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: ['waiter-requests', status],
    queryFn: () => get<WaiterRequest[]>('/waiter-requests', status ? { status } : undefined),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval ?? 5000,
    staleTime: options?.staleTime,
  });
}
