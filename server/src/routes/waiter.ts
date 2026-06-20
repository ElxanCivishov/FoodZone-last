import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { waiterRequestSchema, waiterRequestStatusSchema } from '../lib/validation';

const router = Router();

router.get('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { status, branchId } = req.query;
    const where: any = {};
    if (status) {
      if (!['pending', 'accepted', 'done'].includes(status as string)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      where.status = status;
    }
    if (branchId) {
      where.table = { branchId: branchId as string };
    }
    const requests = await prisma.waiterRequest.findMany({
      where,
      include: { table: true },
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
    });
    const io = (req as any).io;
    io.to('waiters').emit('waiter:new:request', { ...request, tableNumber: table.number ?? undefined });
    io.to('admin').emit('waiter:new:request', { requestId: request.id, tableId, type, status: 'pending' });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authenticate, authorize(['admin', 'manager', 'waiter']), validate(waiterRequestStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await prisma.waiterRequest.update({
      where: { id: req.params.id },
      data: { status },
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
    }
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
});

export { router as waiterRoutes };
