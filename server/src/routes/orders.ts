import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { OrderCreateSchema, OrderStatusSchema } from '../lib/validation';

const router = Router();

// Create order (public - QR ordering)
router.post('/', validate(OrderCreateSchema), async (req, res, next) => {
  try {
    const { tableId, branchId, items, paymentMethod, specialRequest, discountCode } = req.body;

    // Verify table exists and is active
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Table is not available' });
    }

    // Calculate totals dynamically on server
    let subtotal = 0;
    const orderItemsData = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId, status: 'active' },
          include: { sizes: true, extras: true },
        });
        if (!product) throw new Error(`Product ${item.productId} not found or inactive`);

        let unitPrice = product.price;
        if (item.selectedSizeId) {
          const size = product.sizes.find(s => s.id === item.selectedSizeId);
          if (size) unitPrice += size.priceModifier;
        }

        // Calculate extras price
        let extrasPrice = 0;
        if (item.selectedExtras?.length > 0) {
          const extras = await prisma.productExtra.findMany({
            where: { id: { in: item.selectedExtras } },
          });
          extrasPrice = extras.reduce((sum, e) => sum + e.price, 0);
        }
        unitPrice += extrasPrice;

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        return {
          productId: item.productId,
          quantity: item.quantity,
          selectedSizeId: item.selectedSizeId || null,
          unitPrice,
          totalPrice,
          specialNote: item.specialNote || null,
        };
      })
    );

    const serviceFee = subtotal * 0.05; // 5%
    let discount = 0;

    // Apply coupon
    if (discountCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: discountCode } });
      const now = new Date();
      if (coupon && coupon.status === 'active' && now >= coupon.validFrom && now <= coupon.validUntil) {
        if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
          if (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) {
            if (coupon.discountType === 'percentage') {
              discount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
            } else {
              discount = coupon.discountValue;
            }
            discount = Math.min(discount, subtotal);
            await prisma.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            });
          }
        }
      }
    }

    const total = subtotal + serviceFee - discount;
    const orderNumber = String(Math.floor(10000 + Math.random() * 90000));

    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId,
        branchId,
        subtotal,
        serviceFee,
        discount,
        discountCode: discountCode || null,
        total,
        paymentMethod,
        specialRequest: specialRequest || null,
        status: 'pending',
        items: { create: orderItemsData },
      },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    // Emit real-time events
    req.io.to('kitchen').emit('kitchen:new:order', order);
    req.io.to('admin').emit('kitchen:new:order', order);
    req.io.to(`table:${tableId}`).emit('customer:order:update', { 
      orderId: order.id, 
      status: 'confirmed',
      message: 'Order confirmed and sent to kitchen',
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

// Get order by ID
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { 
        items: { include: { product: true } }, 
        table: true,
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// Get orders by table
router.get('/table/:tableId', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tableId: req.params.tableId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// Get all orders (admin/manager/kitchen/waiter)
router.get('/', authenticate, authorize(['admin', 'manager', 'kitchen', 'waiter']), async (req, res, next) => {
  try {
    const { status, branchId, limit = '50', offset = '0' } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (branchId) where.branchId = branchId as string;

    const orders = await prisma.order.findMany({
      where,
      include: { 
        items: { include: { product: true } }, 
        table: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// Update order status
router.patch('/:orderId/status', authenticate, authorize(['admin', 'manager', 'kitchen', 'waiter']), validate(OrderStatusSchema), async (req, res, next) => {
  try {
    const { status, estimatedTime } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { status, estimatedTime },
      include: { items: true, table: true },
    });

    const eventData = { 
      orderId: order.id, 
      status, 
      estimatedTime,
      tableId: order.tableId,
    };

    req.io.to(`table:${order.tableId}`).emit('order:status:update', eventData);
    req.io.to('admin').emit('order:status:changed', eventData);

    if (status === 'preparing') {
      req.io.to(`table:${order.tableId}`).emit('customer:order:update', {
        orderId: order.id,
        status: 'preparing',
        estimatedTime,
        message: 'Kitchen is preparing your order',
      });
    }
    if (status === 'ready') {
      req.io.to('waiters').emit('waiter:new:order', {
        orderId: order.id,
        tableId: order.tableId,
        status: 'ready',
        message: 'Order ready to serve',
      });
      req.io.to(`table:${order.tableId}`).emit('customer:order:ready', {
        orderId: order.id,
        status: 'ready',
        message: 'Your order is ready!',
      });
    }
    if (status === 'served') {
      req.io.to(`table:${order.tableId}`).emit('customer:order:update', {
        orderId: order.id,
        status: 'served',
        message: 'Your order has been served',
      });
    }

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

export { router as orderRoutes };
