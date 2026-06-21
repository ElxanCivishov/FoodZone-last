import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/services/api';
import { Order, OrderStatus } from '@/types';

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => get<Order>(`/orders/${orderId}`),
    enabled: !!orderId,
  });
}

export function useTableOrders(tableId: string) {
  return useQuery({
    queryKey: ['orders', 'table', tableId],
    queryFn: () => get<Order[]>(`/orders/table/${tableId}`),
    enabled: !!tableId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      estimatedTime,
      cancelReason,
    }: {
      orderId: string;
      status: OrderStatus;
      estimatedTime?: number;
      cancelReason?: string;
    }) =>
      patch<Order>(`/orders/${orderId}/status`, {
        status,
        estimatedTime,
        cancelReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
