import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '@/services/socket';

export function useAdminRealtime() {
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();

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

    socket.on('kitchen:new:order', refreshOps);
    socket.on('order:status:changed', refreshOps);
    socket.on('waiter:new:request', refreshOps);
    socket.on('waiter:request:accepted', refreshOps);
    socket.on('waiter:request:completed', refreshOps);
    socket.on('menu:changed', refreshMenu);
    socket.on('qr:changed', refreshQr);

    return () => {
      socket.off('kitchen:new:order', refreshOps);
      socket.off('order:status:changed', refreshOps);
      socket.off('waiter:new:request', refreshOps);
      socket.off('waiter:request:accepted', refreshOps);
      socket.off('waiter:request:completed', refreshOps);
      socket.off('menu:changed', refreshMenu);
      socket.off('qr:changed', refreshQr);
      socket.emit('room:leave', { room: 'admin' });
    };
  }, [socket, queryClient]);

  return isConnected;
}
