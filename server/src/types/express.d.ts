import { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      io: SocketIOServer;
      user?: {
        id?: string;
        userId?: string;
        email?: string;
        role: string;
        name?: string;
      };
    }
  }
}

export {};
