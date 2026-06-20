import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.post('/', async (req, res) => {
  try {
    const { tableId, branchId, items, subtotal, serviceFee, discount, total, paymentMethod, specialRequest } = req.body;
    const orderNumber = String(Math.floor(10000 + Math.random() * 90000));

    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId,
        branchId,
        subtotal,
        serviceFee,
        discount: discount || 0,
        total,
        paymentMethod,
        specialRequest,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSizeId: item.selectedSizeId,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specialNote: item.specialNote,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

router.get('/table/:tableId', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tableId: req.params.tableId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.patch('/:orderId/status', async (req, res) => {
  try {
    const { status, estimatedTime } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { status, estimatedTime },
      include: { items: true, table: true },
    });
    const io = (req as any).io;
    if (io) {
      io.to(`table:${order.tableId}`).emit('order:status:update', {
        orderId: order.id,
        status,
        estimatedTime,
      });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

export { router as orderRoutes };
