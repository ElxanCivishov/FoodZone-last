import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { waiterRequestSchema, waiterRequestStatusSchema } from '../lib/validation';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const requestInclude = {
  table: true,
  acceptedBy: { select: { id: true, name: true } },
  rejectedBy: { select: { id: true, name: true } },
};

router.get('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { status, branchId } = req.query;

    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0, 0);

    // Auto-cancel pending/accepted requests older than today's 06:00 cutoff
    await prisma.waiterRequest.updateMany({
      where: {
        status: { in: ['pending', 'accepted'] },
        createdAt: { lt: cutoff },
      },
      data: { status: 'rejected', rejectionNote: 'auto-cancelled' },
    });

    const where: any = {
      createdAt: { gte: cutoff },
    };
    if (status) {
      if (!['pending', 'accepted', 'done', 'rejected'].includes(status as string)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      where.status = status;
    }
    if (branchId) {
      where.table = { branchId: branchId as string };
    }

    const requests = await prisma.waiterRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

router.post('/', validate(waiterRequestSchema), async (req, res, next) => {
  try {
    const { tableId, type, message } = req.body;

    const table = await prisma.table.findUnique({ where: { id: tableId }, select: { id: true, number: true } });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const request = await prisma.waiterRequest.create({
      data: { tableId, type, message },
      include: requestInclude,
    });
    const io = (req as any).io;
    io.to('waiters').emit('waiter:new:request', { ...request, tableNumber: table.number ?? undefined });
    io.to('admin').emit('waiter:new:request', { requestId: request.id, tableId, type, status: 'pending' });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authenticate, authorize(['admin', 'manager', 'waiter']), validate(waiterRequestStatusSchema), async (req: AuthRequest, res, next) => {
  try {
    const { status, rejectionNote } = req.body;
    const actorId = req.user?.id ?? req.user?.userId;

    const data: any = { status };
    if (status === 'accepted') {
      data.acceptedById = actorId ?? null;
      data.acceptedAt = new Date();
    } else if (status === 'rejected') {
      data.rejectedById = actorId ?? null;
      data.rejectedAt = new Date();
      if (rejectionNote) data.rejectionNote = rejectionNote;
    }

    const request = await prisma.waiterRequest.update({
      where: { id: req.params.id },
      data,
      include: requestInclude,
    });

    const io = (req as any).io;
    if (status === 'accepted') {
      io.to('waiters').emit('waiter:request:accepted', request);
      io.to('admin').emit('waiter:request:accepted', request);
      io.to(`table:${request.tableId}`).emit('customer:waiter:accepted', {
        requestId: request.id,
        status: 'accepted',
        message: 'Waiter is on the way!',
      });
    } else if (status === 'done') {
      io.to('waiters').emit('waiter:request:completed', request);
      io.to('admin').emit('waiter:request:completed', request);
      io.to(`table:${request.tableId}`).emit('customer:waiter:accepted', {
        requestId: request.id,
        status: 'completed',
        message: 'Request completed',
      });
    } else if (status === 'rejected') {
      io.to('waiters').emit('waiter:request:rejected', request);
      io.to('admin').emit('waiter:request:rejected', request);
      io.to(`table:${request.tableId}`).emit('customer:waiter:accepted', {
        requestId: request.id,
        status: 'rejected',
        message: 'Request rejected',
      });
    }
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
});

export { router as waiterRoutes };
