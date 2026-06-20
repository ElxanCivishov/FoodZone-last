import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/utils/constants";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitEvent: (event: string, data: unknown) => void;
  joinRoom: (room: string, role: string, userId?: string) => void;
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
  // useRef əvəzinə useState istifadə et - beləliklə socket yeniləndikdə re-render olacaq
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || "", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Socket state-ə yaz
    setSocket(newSocket);

    const handleConnect = () => {
      console.log("[Socket] Connected:", newSocket.id);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    };

    const handleError = (error: Error) => {
      console.error("[Socket] Connection error:", error.message);
      setIsConnected(false);
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleError);

    // Əgər artıq connect olubsa (rare race condition)
    if (newSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("connect_error", handleError);
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  // socket dependency array-ə əlavə edildi
  const emitEvent = useCallback(
    (event: string, data: unknown) => {
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        console.warn("[Socket] Not connected, event dropped:", event);
      }
    },
    [socket],
  );

  const joinRoom = useCallback(
    (room: string, role: string, userId?: string) => {
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
          room,
          role,
          userId: userId || "anonymous",
        });
      }
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (room: string) => {
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { room });
      }
    },
    [socket],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emitEvent,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
