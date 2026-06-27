import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/services/api';
import { Order, OrderStatus } from '@/types';

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
