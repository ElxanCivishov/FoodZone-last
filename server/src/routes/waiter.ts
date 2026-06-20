import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.post('/', async (req, res) => {
  try {
    const { tableId, type, message } = req.body;
    const request = await prisma.waiterRequest.create({
      data: { tableId, type, message, status: 'pending' },
      include: { table: true },
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create waiter request' });
  }
});

router.get('/', async (req, res) => {
  try {
    const requests = await prisma.waiterRequest.findMany({
      where: { status: { in: ['pending', 'accepted'] } },
      include: { table: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, waiterId } = req.body;
    const request = await prisma.waiterRequest.update({
      where: { id: req.params.id },
      data: { status },
      include: { table: true },
    });
    const io = (req as any).io;
    if (io) {
      io.to(`table:${request.tableId}`).emit('waiter:request:update', {
        requestId: request.id,
        status,
        waiterId,
      });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update request' });
  }
});

export { router as waiterRoutes };
