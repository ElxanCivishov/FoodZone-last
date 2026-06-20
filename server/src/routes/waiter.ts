import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { WaiterRequestSchema, WaiterRequestStatusSchema } from '../lib/validation';

const router = Router();

// Create waiter request (public - customer can call waiter)
router.post('/', validate(WaiterRequestSchema), async (req, res, next) => {
  try {
    const { tableId, type, message } = req.body;

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const request = await prisma.waiterRequest.create({
      data: { tableId, type, message: message || null, status: 'pending' },
      include: { table: true },
    });

    req.io.to('waiters').emit('waiter:new:request', {
      requestId: request.id,
      tableId: request.tableId,
      tableNumber: table.number,
      type,
      message: message || null,
      status: 'pending',
      createdAt: request.createdAt,
    });
    req.io.to('admin').emit('waiter:new:request', {
      requestId: request.id,
      tableId: request.tableId,
      type,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
});

// Get all waiter requests (protected)
router.get('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) {
      where.status = { in: (status as string).split(',') };
    } else {
      where.status = { in: ['pending', 'accepted'] };
    }

    const requests = await prisma.waiterRequest.findMany({
      where,
      include: { table: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

// Update request status (protected - waiter only)
router.patch('/:id/status', authenticate, authorize(['admin', 'manager', 'waiter']), validate(WaiterRequestStatusSchema), async (req, res, next) => {
  try {
    const { status, waiterId } = req.body;
    const request = await prisma.waiterRequest.update({
      where: { id: req.params.id },
      data: { status },
      include: { table: true },
    });

    const eventData = {
      requestId: request.id,
      status,
      tableId: request.tableId,
      waiterId: waiterId || req.user?.id,
    };

    req.io.to(`table:${request.tableId}`).emit('waiter:request:update', eventData);

    if (status === 'accepted') {
      req.io.to(`table:${request.tableId}`).emit('customer:waiter:accepted', {
        requestId: request.id,
        status: 'accepted',
        message: 'Waiter is on the way!',
      });
    }
    if (status === 'done') {
      req.io.to(`table:${request.tableId}`).emit('customer:waiter:accepted', {
        requestId: request.id,
        status: 'completed',
        message: 'Request completed',
      });
    }

    res.json({ success: true, data: request });
  } catch (err) { next(err); }
});

export { router as waiterRoutes };
