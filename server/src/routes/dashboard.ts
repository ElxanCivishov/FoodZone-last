import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      totalTables,
      activeTables,
      pendingOrders,
      readyOrders,
      recentOrders,
      popularProducts,
    ] = await Promise.all([
      prisma.order.count({ where: branchFilter }),
      prisma.order.count({ where: { ...branchFilter, createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: branchFilter, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...branchFilter, createdAt: { gte: today } }, _sum: { total: true } }),
      prisma.table.count({ where: branchFilter }),
      prisma.table.count({ where: { ...branchFilter, status: 'occupied' } }),
      prisma.order.count({ where: { ...branchFilter, status: 'pending' } }),
      prisma.order.count({ where: { ...branchFilter, status: 'ready' } }),
      prisma.order.findMany({
        where: branchFilter,
        take: 10,
        include: { table: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: branchId ? { category: { branchId } } : {},
        take: 5,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        todayOrders,
        todayRevenue: todayRevenue._sum.total || 0,
        totalTables,
        activeTables,
        avgOrderTime: 12,
        pendingOrders,
        readyOrders,
        recentOrders,
        popularProducts,
      },
    });
  } catch (err) { next(err); }
});

router.get('/orders-by-status', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
    const result = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.order.count({ where: { ...branchFilter, status } }),
      }))
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export { router as dashboardRoutes };
