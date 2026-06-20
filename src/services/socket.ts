import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@/utils/constants';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitEvent: (event: string, data: unknown) => void;
  joinRoom: (room: string, role: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitEvent: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
});

export const useSocketContext = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => { socket.disconnect(); };
  }, []);

  const emitEvent = useCallback((event: string, data: unknown) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string, role: string) => {
    if (socketRef.current) socketRef.current.emit(SOCKET_EVENTS.JOIN_TABLE, { room, role });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current) socketRef.current.emit(SOCKET_EVENTS.LEAVE_TABLE, { room });
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, emitEvent, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}
