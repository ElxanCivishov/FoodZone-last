import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '@/services/socket';
import { useNotificationsStore, type NotificationType } from '@/stores/notificationsStore';

function mapBackendType(type: string): NotificationType {
  if (type === 'low_stock') return 'alert';
  if (type === 'payment_received') return 'star';
  if (type === 'order_cancelled') return 'alert';
  if (type === 'sla_breach') return 'system';
  return 'system';
}

export function useAdminRealtime() {
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();
  const addSocketNotification = useNotificationsStore((s) => s.addSocketNotification);

  useEffect(() => {
    if (!socket) return;

    socket.emit('room:join', { room: 'admin', role: 'admin' });

    const refreshOps = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'by-status'] });
    };

    const refreshMenu = () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const refreshQr = () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const handleNotification = (raw: any) => {
      addSocketNotification({
        id: raw.id,
        title: raw.title,
        description: raw.message,
        time: new Date(raw.createdAt),
        type: mapBackendType(raw.type),
        backendType: raw.type,
        read: raw.isRead ?? false,
      });
    };

    socket.on('kitchen:new:order', refreshOps);
    socket.on('order:status:changed', refreshOps);
    socket.on('waiter:new:request', refreshOps);
    socket.on('waiter:request:accepted', refreshOps);
    socket.on('waiter:request:completed', refreshOps);
    socket.on('menu:changed', refreshMenu);
    socket.on('qr:changed', refreshQr);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('kitchen:new:order', refreshOps);
      socket.off('order:status:changed', refreshOps);
      socket.off('waiter:new:request', refreshOps);
      socket.off('waiter:request:accepted', refreshOps);
      socket.off('waiter:request:completed', refreshOps);
      socket.off('menu:changed', refreshMenu);
      socket.off('qr:changed', refreshQr);
      socket.off('notification', handleNotification);
      socket.emit('room:leave', { room: 'admin' });
    };
  }, [socket, queryClient, addSocketNotification]);

  return isConnected;
}
