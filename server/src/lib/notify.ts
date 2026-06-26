import type { Server } from 'socket.io';
import { prisma } from './prisma';

type NotifyInput = {
  io: Server;
  branchId?: string | null;
  userId?: string | null;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export async function notify({ io, branchId, userId, type, title, message, data }: NotifyInput) {
  const notification = await (prisma.notification.create as any)({
    data: {
      ...(branchId && { branchId }),
      ...(userId && { userId }),
      type,
      title,
      message,
      ...(data && { data }),
    },
  });
  io.to('admin').emit('notification', notification);
  return notification;
}
