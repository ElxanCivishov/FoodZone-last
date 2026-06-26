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

// Revenue trend — parametrli
router.get('/revenue-trend', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '7' } = req.query;
    const days = Math.min(90, Math.max(1, Number(daysParam)));
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

    // Öncəki dövr müqayisəsi
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    const [prevRevAgg, prevOrderCount] = await Promise.all([
      prisma.order.aggregate({
        where: { ...(branchId ? { branchId: branchId as string } : {}), paymentStatus: 'paid', paidAt: { gte: prevSince, lt: since } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { ...(branchId ? { branchId: branchId as string } : {}), createdAt: { gte: prevSince, lt: since }, status: { not: 'cancelled' } },
      }),
    ]);

    res.json({
      success: true,
      data: result,
      comparison: { prevRevenue: prevRevAgg._sum.total ?? 0, prevOrders: prevOrderCount },
    });
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

// Ödəniş metodu trendi (gün üzrə)
router.get('/payment-trend', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '30' } = req.query;
    const days = Math.min(90, Math.max(1, Number(daysParam)));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        ...(branchId ? { branchId: branchId as string } : {}),
        paymentStatus: 'paid',
        paidAt: { gte: since },
      },
      select: { paidAt: true, paymentMethod: true, total: true },
    });

    const dayMap = new Map<string, { cash: number; card: number; online: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().split('T')[0], { cash: 0, card: 0, online: 0 });
    }

    for (const o of orders) {
      if (!o.paidAt) continue;
      const key = new Date(o.paidAt).toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (!entry) continue;
      const method = o.paymentMethod ?? 'cash';
      if (method === 'cash') entry.cash += o.total;
      else if (method === 'card') entry.card += o.total;
      else if (method === 'online') entry.online += o.total;
    }

    const result = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Kateqoriya gəlir paylanması
router.get('/category-breakdown', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Math.min(90, Number(daysParam)));
    since.setHours(0, 0, 0, 0);

    const categories = await prisma.category.findMany({
      where: branchId ? { branchId: branchId as string } : {},
      select: { id: true, name: true, products: { select: { id: true } } },
    });

    const allProductIds = categories.flatMap(c => c.products.map(p => p.id));

    const itemStats = allProductIds.length > 0
      ? await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: allProductIds },
            order: {
              ...(branchId ? { branchId: branchId as string } : {}),
              createdAt: { gte: since },
              status: { not: 'cancelled' },
            },
          },
          _sum: { totalPrice: true },
          _count: { id: true },
        })
      : [];

    const statsMap = new Map(itemStats.map(s => [s.productId, s]));
    const categoryProductMap = new Map(categories.map(c => [c.id, c.products.map(p => p.id)]));

    const rows = categories.map(c => {
      const pids = categoryProductMap.get(c.id) ?? [];
      let revenue = 0;
      let orders = 0;
      for (const pid of pids) {
        const s = statsMap.get(pid);
        if (s) {
          revenue += Number(s._sum?.totalPrice ?? 0);
          orders += s._count?.id ?? 0;
        }
      }
      return { categoryId: c.id, categoryName: c.name, orders, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const data = rows.map(r => ({
      ...r,
      revenuePct: totalRevenue > 0 ? +(r.revenue / totalRevenue * 100).toFixed(1) : 0,
    }));

    res.json({ success: true, data, totalRevenue });
  } catch (err) { next(err); }
});

// Masa dolulluq trendi (gün üzrə)
router.get('/table-occupancy', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '7' } = req.query;
    if (!branchId) return res.json({ success: true, data: [] });

    const days = Math.min(30, Math.max(1, Number(daysParam)));
    const totalTables = await prisma.table.count({ where: { branchId: branchId as string } });
    if (totalTables === 0) return res.json({ success: true, data: [], totalTables: 0 });

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const uniqueTables = await prisma.order.findMany({
        where: {
          branchId: branchId as string,
          createdAt: { gte: d, lt: next },
          status: { not: 'cancelled' },
          tableId: { not: null },
        },
        select: { tableId: true },
        distinct: ['tableId'],
      });

      const cancellations = await prisma.order.count({
        where: {
          branchId: branchId as string,
          createdAt: { gte: d, lt: next },
          status: 'cancelled',
        },
      });

      const totalOrdersDay = await prisma.order.count({
        where: { branchId: branchId as string, createdAt: { gte: d, lt: next } },
      });

      result.push({
        date: d.toISOString().split('T')[0],
        uniqueTablesUsed: uniqueTables.length,
        totalTables,
        occupancyPct: Math.round((uniqueTables.length / totalTables) * 100),
        cancellations,
        totalOrders: totalOrdersDay,
        cancellationRate: totalOrdersDay > 0 ? Math.round((cancellations / totalOrdersDay) * 100) : 0,
      });
    }

    res.json({ success: true, data: result, totalTables });
  } catch (err) { next(err); }
});

// Product ABC Analizi
router.get('/product-abc', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    since.setHours(0, 0, 0, 0);

    const [products, itemStats] = await Promise.all([
      prisma.product.findMany({
        where: branchId ? { category: { branchId: branchId as string } } : {},
        select: { id: true, name: true, category: { select: { name: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            ...(branchId ? { branchId: branchId as string } : {}),
            createdAt: { gte: since },
            status: { not: 'cancelled' },
          },
        },
        _sum: { quantity: true, totalPrice: true },
      }),
    ]);

    const statsMap = new Map(itemStats.map(s => [s.productId, s]));
    const rows = products.map(p => {
      const stats = statsMap.get(p.id);
      return {
        productId: p.id,
        name: p.name,
        categoryName: p.category?.name ?? 'Kateqoriyasız',
        count: Number(stats?._sum?.quantity ?? 0),
        revenue: Number(stats?._sum?.totalPrice ?? 0),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    let cumulative = 0;
    const classified = rows.map(r => {
      cumulative += r.revenue;
      const pct = totalRevenue > 0 ? cumulative / totalRevenue : 1;
      return {
        ...r,
        abc: (pct <= 0.7 ? 'A' : pct <= 0.9 ? 'B' : 'C') as 'A' | 'B' | 'C',
        revenuePct: totalRevenue > 0 ? +(r.revenue / totalRevenue * 100).toFixed(1) : 0,
      };
    });

    res.json({ success: true, data: classified, totalRevenue });
  } catch (err) { next(err); }
});

// Həftəlik Heatmap (saat × gün)
router.get('/weekly-heatmap', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, weeks = '4' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(weeks) * 7);
    since.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        ...(branchId ? { branchId: branchId as string } : {}),
        createdAt: { gte: since },
        status: { not: 'cancelled' },
      },
      select: { createdAt: true },
    });

    const matrix: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      matrix[d.getHours()][d.getDay()]++;
    });

    const flat = [];
    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 7; d++) {
        flat.push({ hour: h, day: d, count: matrix[h][d] });
      }
    }
    const maxCount = Math.max(...flat.map(f => f.count), 1);

    res.json({ success: true, data: flat, max: maxCount });
  } catch (err) { next(err); }
});

// Mətbəx Statistikası (hazırlıq vaxtı trendi)
router.get('/kitchen-stats', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '7' } = req.query;
    const days = Math.min(90, Math.max(1, Number(daysParam)));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        ...(branchId ? { branchId: branchId as string } : {}),
        createdAt: { gte: since },
      },
      select: { createdAt: true, status: true, preparationDuration: true },
    });

    const dayMap = new Map<string, { total: number; cancelled: number; prepSum: number; prepCount: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().split('T')[0], { total: 0, cancelled: 0, prepSum: 0, prepCount: 0 });
    }

    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (!entry) continue;
      entry.total++;
      if (o.status === 'cancelled') entry.cancelled++;
      if (o.preparationDuration && o.preparationDuration > 0) {
        entry.prepSum += o.preparationDuration;
        entry.prepCount++;
      }
    }

    const result = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      avgPrepTime: v.prepCount > 0 ? Math.round(v.prepSum / v.prepCount) : 0,
      ordersWithPrepData: v.prepCount,
      totalOrders: v.total,
      cancelledOrders: v.cancelled,
      completionRate: v.total > 0 ? Math.round(((v.total - v.cancelled) / v.total) * 100) : 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Promo trend (gün üzrə)
router.get('/promo-trend', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '30' } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const days = Math.min(90, Math.max(1, Number(daysParam)));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [orders, totalRevAgg] = await Promise.all([
      prisma.order.findMany({
        where: { branchId: branchId as string, promoCodeId: { not: null }, createdAt: { gte: since }, status: { not: 'cancelled' } },
        select: { createdAt: true, promoDiscount: true },
      }),
      prisma.order.aggregate({
        where: { branchId: branchId as string, paymentStatus: 'paid', paidAt: { gte: since } },
        _sum: { total: true },
      }),
    ]);

    const dayMap = new Map<string, { ordersWithPromo: number; discountGiven: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().split('T')[0], { ordersWithPromo: 0, discountGiven: 0 });
    }
    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (entry) { entry.ordersWithPromo++; entry.discountGiven += o.promoDiscount; }
    }

    const result = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));
    const totalDiscount = orders.reduce((s, o) => s + o.promoDiscount, 0);
    const totalRev = totalRevAgg._sum.total ?? 0;

    res.json({
      success: true,
      data: result,
      totalImpact: {
        ordersWithPromo: orders.length,
        totalDiscount,
        discountPct: totalRev > 0 ? +(totalDiscount / totalRev * 100).toFixed(1) : 0,
      },
    });
  } catch (err) { next(err); }
});

// Müştəri analitikası
router.get('/customer-analytics', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days: daysParam = '30' } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const days = Math.min(90, Math.max(1, Number(daysParam)));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [newCustomersRaw, totalCustomers, topCustomers, avgAgg] = await Promise.all([
      prisma.customer.findMany({
        where: { branchId: branchId as string, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.customer.count({ where: { branchId: branchId as string } }),
      prisma.customer.findMany({
        where: { branchId: branchId as string, totalSpent: { gt: 0 } },
        orderBy: { totalSpent: 'desc' },
        take: 10,
        select: { id: true, name: true, phone: true, totalOrders: true, totalSpent: true, points: true, tags: true },
      }),
      prisma.customer.aggregate({
        where: { branchId: branchId as string, totalSpent: { gt: 0 } },
        _avg: { totalSpent: true },
      }),
    ]);

    const dayMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().split('T')[0], 0);
    }
    for (const c of newCustomersRaw) {
      const key = new Date(c.createdAt).toISOString().split('T')[0];
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    res.json({
      success: true,
      data: Array.from(dayMap.entries()).map(([date, newCustomers]) => ({ date, newCustomers })),
      summary: {
        totalCustomers,
        newInPeriod: newCustomersRaw.length,
        avgSpend: avgAgg._avg.totalSpent ?? 0,
        topCustomers,
      },
    });
  } catch (err) { next(err); }
});

// ── Müqayisəli Hesabat ───────────────────────────────────────────────────────
router.get('/comparison', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const branchFilter = branchId ? { branchId: branchId as string } : {};

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisWeek, lastWeek, thisMonth, lastMonth] = await Promise.all([
      prisma.order.aggregate({ where: { ...branchFilter, createdAt: { gte: thisWeekStart }, status: { not: 'cancelled' } }, _sum: { total: true }, _count: { id: true } }),
      prisma.order.aggregate({ where: { ...branchFilter, createdAt: { gte: lastWeekStart, lt: lastWeekEnd }, status: { not: 'cancelled' } }, _sum: { total: true }, _count: { id: true } }),
      prisma.order.aggregate({ where: { ...branchFilter, createdAt: { gte: thisMonthStart }, status: { not: 'cancelled' } }, _sum: { total: true }, _count: { id: true } }),
      prisma.order.aggregate({ where: { ...branchFilter, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, status: { not: 'cancelled' } }, _sum: { total: true }, _count: { id: true } }),
    ]);

    const pct = (cur: number, prev: number) => prev === 0 ? 100 : +((cur - prev) / prev * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        week: {
          current:    { revenue: thisWeek._sum.total ?? 0, orders: thisWeek._count.id },
          previous:   { revenue: lastWeek._sum.total ?? 0, orders: lastWeek._count.id },
          revenuePct: pct(thisWeek._sum.total ?? 0, lastWeek._sum.total ?? 0),
          ordersPct:  pct(thisWeek._count.id, lastWeek._count.id),
        },
        month: {
          current:    { revenue: thisMonth._sum.total ?? 0, orders: thisMonth._count.id },
          previous:   { revenue: lastMonth._sum.total ?? 0, orders: lastMonth._count.id },
          revenuePct: pct(thisMonth._sum.total ?? 0, lastMonth._sum.total ?? 0),
          ordersPct:  pct(thisMonth._count.id, lastMonth._count.id),
        },
      },
    });
  } catch (err) { next(err); }
});

// ── Konversiya Funnel ─────────────────────────────────────────────────────────
router.get('/funnel', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, days = '7' } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);
    const filter: any = { createdAt: { gte: since } };
    if (branchId) filter.branchId = branchId;

    const [total, confirmed, paid] = await Promise.all([
      prisma.order.count({ where: filter }),
      prisma.order.count({ where: { ...filter, status: { not: 'cancelled' } } }),
      prisma.order.count({ where: { ...filter, paymentStatus: 'paid' } }),
    ]);

    res.json({
      success: true,
      data: [
        { stage: 'Sifariş verildi',  count: total,     pct: 100 },
        { stage: 'Qəbul edildi',     count: confirmed, pct: total ? +(confirmed / total * 100).toFixed(1) : 0 },
        { stage: 'Ödənilib',         count: paid,      pct: total ? +(paid / total * 100).toFixed(1) : 0 },
      ],
    });
  } catch (err) { next(err); }
});

// ── Canlı Masa Xəritəsi ──────────────────────────────────────────────────────
router.get('/live-tables', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const tables = await prisma.table.findMany({
      where: { branchId: branchId as string, status: 'active' },
      orderBy: { number: 'asc' },
    });

    const activeOrders = await prisma.order.findMany({
      where: { branchId: branchId as string, status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } },
      select: { tableId: true, status: true, total: true },
    });

    const tableOrderMap: Record<string, { status: string; revenue: number }[]> = {};
    for (const o of activeOrders) {
      if (!o.tableId) continue;
      if (!tableOrderMap[o.tableId]) tableOrderMap[o.tableId] = [];
      tableOrderMap[o.tableId].push({ status: o.status, revenue: o.total });
    }

    const result = tables.map(t => {
      const orders = tableOrderMap[t.id] ?? [];
      const hasPayment = orders.some(o => o.status === 'ready');
      const liveStatus = orders.length === 0 ? 'free'
        : hasPayment ? 'payment'
        : 'occupied';
      const activeRevenue = orders.reduce((s, o) => s + o.revenue, 0);
      return { id: t.id, number: t.number, liveStatus, activeRevenue };
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export { router as dashboardRoutes };
