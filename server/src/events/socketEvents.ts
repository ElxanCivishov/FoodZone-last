import { Server, Socket } from 'socket.io';

const ROOMS = {
  KITCHEN: 'kitchen',
  WAITERS: 'waiters',
  ADMIN: 'admin',
  TABLE: (tableId: string) => `table:${tableId}`,
  BRANCH: (branchId: string) => `branch:${branchId}`,
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ORDER_PLACED: 'order:placed',
  ORDER_STATUS_CHANGED: 'order:status:changed',
  ORDER_ACCEPTED: 'order:accepted',
  ORDER_ITEM_READY: 'order:item:ready',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',
  ORDER_CANCELLED: 'order:cancelled',
  KITCHEN_NEW_ORDER: 'kitchen:new:order',
  KITCHEN_ORDER_ACCEPTED: 'kitchen:order:accepted',
  KITCHEN_ORDER_READY: 'kitchen:order:ready',
  WAITER_NEW_ORDER: 'waiter:new:order',
  WAITER_ORDER_SERVED: 'waiter:order:served',
  WAITER_NEW_REQUEST: 'waiter:new:request',
  WAITER_REQUEST_ACCEPTED: 'waiter:request:accepted',
  WAITER_REQUEST_COMPLETED: 'waiter:request:completed',
  CUSTOMER_ORDER_UPDATE: 'customer:order:update',
  CUSTOMER_WAITER_ACCEPTED: 'customer:waiter:accepted',
  CUSTOMER_ORDER_READY: 'customer:order:ready',
  NOTIFICATION: 'notification',
};

export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ room, userId, role }) => {
      socket.join(room);
      socket.data.userId = userId;
      socket.data.role = role;
      console.log(`Socket ${socket.id} joined room ${room} as ${role}`);
      socket.to(room).emit(SOCKET_EVENTS.NOTIFICATION, {
        type: 'info',
        message: `${role} connected`,
        userId,
      });
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ room }) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on(SOCKET_EVENTS.ORDER_PLACED, (orderData) => {
      const { tableId, branchId, orderId } = orderData;
      io.to(ROOMS.KITCHEN).emit(SOCKET_EVENTS.KITCHEN_NEW_ORDER, orderData);
      io.to(ROOMS.ADMIN).emit(SOCKET_EVENTS.KITCHEN_NEW_ORDER, orderData);
      socket.emit(SOCKET_EVENTS.CUSTOMER_ORDER_UPDATE, {
        orderId,
        status: 'confirmed',
        message: 'Order confirmed and sent to kitchen',
      });
      console.log(`Order ${orderId} placed for table ${tableId}`);
    });

    socket.on(SOCKET_EVENTS.ORDER_ACCEPTED, (data) => {
      const { orderId, tableId, estimatedTime } = data;
      io.to(ROOMS.TABLE(tableId)).emit(SOCKET_EVENTS.CUSTOMER_ORDER_UPDATE, {
        orderId,
        status: 'preparing',
        estimatedTime,
        message: 'Kitchen is preparing your order',
      });
      io.to(ROOMS.ADMIN).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
        orderId,
        status: 'preparing',
        tableId,
      });
      console.log(`Order ${orderId} accepted by kitchen`);
    });

    socket.on(SOCKET_EVENTS.ORDER_ITEM_READY, (data) => {
      const { orderId, itemId, tableId } = data;
      io.to(ROOMS.TABLE(tableId)).emit(SOCKET_EVENTS.CUSTOMER_ORDER_UPDATE, {
        orderId,
        itemId,
        status: 'item_ready',
        message: 'An item is ready',
      });
    });

    socket.on(SOCKET_EVENTS.ORDER_READY, (data) => {
      const { orderId, tableId } = data;
      io.to(ROOMS.WAITERS).emit(SOCKET_EVENTS.WAITER_NEW_ORDER, {
        orderId,
        tableId,
        status: 'ready',
        message: 'Order ready to serve',
      });
      io.to(ROOMS.TABLE(tableId)).emit(SOCKET_EVENTS.CUSTOMER_ORDER_READY, {
        orderId,
        status: 'ready',
        message: 'Your order is ready!',
      });
      io.to(ROOMS.ADMIN).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
        orderId,
        status: 'ready',
        tableId,
      });
      console.log(`Order ${orderId} ready for table ${tableId}`);
    });

    socket.on(SOCKET_EVENTS.ORDER_SERVED, (data) => {
      const { orderId, tableId, waiterId } = data;
      io.to(ROOMS.TABLE(tableId)).emit(SOCKET_EVENTS.CUSTOMER_ORDER_UPDATE, {
        orderId,
        status: 'served',
        message: 'Your order has been served',
      });
      io.to(ROOMS.ADMIN).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
        orderId,
        status: 'served',
        tableId,
        waiterId,
      });
      console.log(`Order ${orderId} served by waiter ${waiterId}`);
    });

    socket.on(SOCKET_EVENTS.WAITER_NEW_REQUEST, (data) => {
      const { tableId, requestId, type, message } = data;
      io.to(ROOMS.WAITERS).emit(SOCKET_EVENTS.WAITER_NEW_REQUEST, {
        requestId,
        tableId,
        type,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      io.to(ROOMS.ADMIN).emit(SOCKET_EVENTS.WAITER_NEW_REQUEST, {
        requestId,
        tableId,
        type,
        status: 'pending',
      });
      console.log(`Waiter request from table ${tableId}: ${type}`);
    });

    socket.on(SOCKET_EVENTS.WAITER_REQUEST_ACCEPTED, (data) => {
      const { requestId, tableId, waiterId } = data;
      io.to(ROOMS.TABLE(tableId)).emit(SOCKET_EVENTS.CUSTOMER_WAITER_ACCEPTED, {
        requestId,
        status: 'accepted',
        message: 'Waiter is on the way!',
      });
      console.log(`Waiter ${waiterId} accepted request ${requestId}`);
    });

    socket.on(SOCKET_EVENTS.WAITER_REQUEST_COMPLETED, (data) => {
      const { requestId, tableId } = data;
      io.to(ROOMS.TABLE(tableId)).emit(SOCKET_EVENTS.CUSTOMER_WAITER_ACCEPTED, {
        requestId,
        status: 'completed',
        message: 'Request completed',
      });
      console.log(`Request ${requestId} completed for table ${tableId}`);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export default setupSocketEvents;
