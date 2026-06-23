import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

async function getPopularProducts(branchId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayFilter = branchId
    ? Prisma.sql`WHERE o."branchId" = ${branchId} AND o."createdAt" >= ${today}`
    : Prisma.sql`WHERE o."createdAt" >= ${today}`;
  const fallbackFilter = branchId
    ? Prisma.sql`WHERE o."branchId" = ${branchId}`
    : Prisma.empty;

  let grouped = await prisma.$queryRaw<Array<{ productId: string; orderCount: number; revenue: number }>>`
    SELECT oi."productId", COALESCE(SUM(oi."quantity"), 0)::int AS "orderCount", COALESCE(SUM(oi."totalPrice"), 0)::float AS "revenue"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o."id" = oi."orderId"
    ${todayFilter}
    GROUP BY oi."productId"
    ORDER BY "orderCount" DESC
    LIMIT 5
  `;

  if (grouped.length === 0) {
    grouped = await prisma.$queryRaw<Array<{ productId: string; orderCount: number; revenue: number }>>`
      SELECT oi."productId", COALESCE(SUM(oi."quantity"), 0)::int AS "orderCount", COALESCE(SUM(oi."totalPrice"), 0)::float AS "revenue"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o."id" = oi."orderId"
      ${fallbackFilter}
      GROUP BY oi."productId"
      ORDER BY "orderCount" DESC
      LIMIT 5
    `;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((item) => item.productId) } },
    include: { category: { select: { name: true, nameAz: true, nameEn: true, nameRu: true, nameTr: true } } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  return grouped
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product) return null;
      return { ...product, orderCount: item.orderCount, revenue: item.revenue };
    })
    .filter(Boolean);
}

router.get('/stats', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paidFilter = { ...branchFilter, paymentStatus: 'paid' };
    const todayPaidFilter = { ...paidFilter, paidAt: { gte: today } };

    const [
      totalOrders,
      todayOrders,
      revenueAgg,
      todayRevenueAgg,
      totalTables,
      activeTables,
      pendingOrders,
      readyOrders,
      recentOrders,
      popularProducts,
      avgPreparation,
      // Ödəniş metodu breakdown
      cashRevenue,
      cardRevenue,
      onlineRevenue,
      todayCash,
      todayCard,
      todayOnline,
      // Stok xülasəsi
      lowStockCount,
      outOfStockCount,
      // Aktiv smena
      activeShift,
      // Oxunmamış bildirişlər
      unreadNotifications,
    ] = await Promise.all([
      prisma.order.count({ where: branchFilter }),
      prisma.order.count({ where: { ...branchFilter, createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: paidFilter, _sum: { total: true } }),
      prisma.order.aggregate({ where: todayPaidFilter, _sum: { total: true } }),
      prisma.table.count({ where: branchFilter }),
      prisma.table.count({ where: { ...branchFilter, status: 'occupied' } }),
      prisma.order.count({ where: { ...branchFilter, status: 'pending' } }),
      prisma.order.count({ where: { ...branchFilter, status: 'ready' } }),
      prisma.order.findMany({
        where: branchFilter,
        take: 10,
        include: {
          table: true,
          items: { include: { product: true, extras: true } },
          cancelledBy: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      getPopularProducts(branchId),
      prisma.order.aggregate({
        where: { ...branchFilter, preparationDuration: { not: null } },
        _avg: { preparationDuration: true },
      }),
      // Ödəniş metodları üzrə gəlir
      prisma.order.aggregate({ where: { ...paidFilter, paymentMethod: 'cash' }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...paidFilter, paymentMethod: 'card' }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...paidFilter, paymentMethod: 'online' }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...todayPaidFilter, paymentMethod: 'cash' }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...todayPaidFilter, paymentMethod: 'card' }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...todayPaidFilter, paymentMethod: 'online' }, _sum: { total: true } }),
      // Stok
      branchId ? prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM "Product" p
        INNER JOIN "Category" c ON c.id = p."categoryId"
        WHERE c."branchId" = ${branchId} AND p."stockEnabled" = true
          AND p."stockQuantity" IS NOT NULL AND p."stockQuantity" > 0
          AND p."lowStockThreshold" IS NOT NULL
          AND p."stockQuantity" <= p."lowStockThreshold"
      `.then(r => Number(r[0]?.count ?? 0)).catch(() => 0) : Promise.resolve(0),
      branchId ? prisma.product.count({
        where: { category: { branchId }, stockEnabled: true, stockQuantity: 0 },
      }) : Promise.resolve(0),
      // Aktiv smena
      branchId ? prisma.shift.findFirst({
        where: { branchId, status: 'open' },
        include: { openedBy: { select: { id: true, name: true } } },
        orderBy: { openedAt: 'desc' },
      }) : Promise.resolve(null),
      // Bildirişlər
      branchId ? prisma.notification.count({ where: { branchId, isRead: false } }) : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: revenueAgg._sum.total ?? 0,
        todayOrders,
        todayRevenue: todayRevenueAgg._sum.total ?? 0,
        totalTables,
        activeTables,
        avgOrderTime: Math.round(avgPreparation._avg.preparationDuration ?? 0),
        pendingOrders,
        readyOrders,
        recentOrders,
        popularProducts,
        // Ödəniş breakdown
        paymentBreakdown: {
          cash: cashRevenue._sum.total ?? 0,
          card: cardRevenue._sum.total ?? 0,
          online: onlineRevenue._sum.total ?? 0,
        },
        todayPaymentBreakdown: {
          cash: todayCash._sum.total ?? 0,
          card: todayCard._sum.total ?? 0,
          online: todayOnline._sum.total ?? 0,
        },
        // Stok
        stockAlerts: {
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
        },
        // Smena
        activeShift,
        // Bildirişlər
        unreadNotifications,
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

// Saatlara görə sifariş paylanması (bu gün)
router.get('/hourly', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        ...(branchId ? { branchId: branchId as string } : {}),
        createdAt: { gte: today },
        status: { not: 'cancelled' },
      },
      select: { createdAt: true, total: true, paymentStatus: true },
    });

    const hourly: Record<number, { orders: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) hourly[h] = { orders: 0, revenue: 0 };

    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours();
      hourly[h].orders++;
      if (o.paymentStatus === 'paid') hourly[h].revenue += o.total;
    });

    res.json({ success: true, data: Object.entries(hourly).map(([hour, data]) => ({ hour: Number(hour), ...data })) });
  } catch (err) { next(err); }
});

// Revenue trend — son 7 gün
router.get('/revenue-trend', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const days = 7;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const [agg, count] = await Promise.all([
        prisma.order.aggregate({
          where: {
            ...(branchId ? { branchId: branchId as string } : {}),
            paymentStatus: 'paid',
            paidAt: { gte: d, lt: next },
          },
          _sum: { total: true },
        }),
        prisma.order.count({
          where: {
            ...(branchId ? { branchId: branchId as string } : {}),
            createdAt: { gte: d, lt: next },
            status: { not: 'cancelled' },
          },
        }),
      ]);

      result.push({
        date: d.toISOString().split('T')[0],
        revenue: agg._sum.total ?? 0,
        orders: count,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Filiallar arası müqayisə (super_admin + admin üçün)
router.get('/branches', authenticate, authorize(['admin', 'manager']), async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const branches = await prisma.branch.findMany({
      where: { status: 'active' },
      include: { restaurant: { select: { name: true } } },
    });

    const stats = await Promise.all(branches.map(async branch => {
      const [
        todayOrders, todayRevenue,
        monthOrders, monthRevenue,
        activeOrders, occupiedTables, totalTables,
        lowStock, openShift,
      ] = await Promise.all([
        prisma.order.count({ where: { branchId: branch.id, createdAt: { gte: today } } }),
        prisma.order.aggregate({ where: { branchId: branch.id, paymentStatus: 'paid', paidAt: { gte: today } }, _sum: { total: true } }),
        prisma.order.count({ where: { branchId: branch.id, createdAt: { gte: monthStart } } }),
        prisma.order.aggregate({ where: { branchId: branch.id, paymentStatus: 'paid', paidAt: { gte: monthStart } }, _sum: { total: true } }),
        prisma.order.count({ where: { branchId: branch.id, status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } } }),
        prisma.table.count({ where: { branchId: branch.id, status: 'occupied' } }),
        prisma.table.count({ where: { branchId: branch.id, status: { not: 'inactive' } } }),
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint as count FROM "Product" p
          INNER JOIN "Category" c ON c.id = p."categoryId"
          WHERE c."branchId" = ${branch.id} AND p."stockEnabled" = true
            AND p."stockQuantity" IS NOT NULL AND p."stockQuantity" > 0
            AND p."lowStockThreshold" IS NOT NULL
            AND p."stockQuantity" <= p."lowStockThreshold"
        `.then(r => Number(r[0]?.count ?? 0)).catch(() => 0),
        prisma.shift.findFirst({ where: { branchId: branch.id, status: 'open' }, select: { openedAt: true } }),
      ]);

      return {
        branchId: branch.id,
        branchName: branch.name,
        restaurantName: branch.restaurant.name,
        today: {
          orders: todayOrders,
          revenue: todayRevenue._sum.total ?? 0,
        },
        month: {
          orders: monthOrders,
          revenue: monthRevenue._sum.total ?? 0,
        },
        activeOrders,
        occupiedTables,
        totalTables,
        tableOccupancyPct: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
        lowStockAlerts: lowStock,
        shiftOpen: !!openShift,
        shiftOpenedAt: openShift?.openedAt ?? null,
      };
    }));

    // Sıralama: bu günkü gəlirə görə azalan
    stats.sort((a, b) => b.today.revenue - a.today.revenue);

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

export { router as dashboardRoutes };
