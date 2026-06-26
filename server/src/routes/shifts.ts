import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { generateRangeReportXLSX } from '../lib/excelExport';

const router = Router();

// Aktiv smena
router.get('/active', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const shift = await prisma.shift.findFirst({
      where: { branchId: branchId as string, status: 'open' },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// Smenalar siyahısı
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, page = '1', limit = '20' } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const skip = (Number(page) - 1) * Number(limit);
    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where: { branchId: branchId as string },
        include: {
          openedBy: { select: { id: true, name: true } },
          closedBy: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.shift.count({ where: { branchId: branchId as string } }),
    ]);

    res.json({ success: true, data: shifts, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// Smena aç
router.post('/open', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, openingCash, notes } = req.body;
    const userId = (req as any).user?.id;

    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const existing = await prisma.shift.findFirst({ where: { branchId, status: 'open' } });
    if (existing) return res.status(400).json({ success: false, message: 'Artıq açıq smena var' });

    const shift = await prisma.shift.create({
      data: {
        branchId,
        openedById: userId,
        openingCash: openingCash ?? 0,
        status: 'open',
        notes,
      },
      include: { openedBy: { select: { id: true, name: true } } },
    });

    res.status(201).json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// Smena bağla — tam hesabat generasiya edir
router.post('/:id/close', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const userId = (req as any).user?.id;

    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) return res.status(404).json({ success: false, message: 'Smena tapılmadı' });
    if (shift.status !== 'open') return res.status(400).json({ success: false, message: 'Smena artıq bağlıdır' });

    // Bu smena zamanı yaradılmış sifarişlər (openedAt-dan indi-yə qədər)
    const orders = await prisma.order.findMany({
      where: {
        branchId: shift.branchId,
        createdAt: { gte: shift.openedAt },
        status: { not: 'cancelled' },
      },
      include: {
        items: { include: { product: { select: { nameAz: true } } } },
      },
    });

    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const cancelledCount = await prisma.order.count({
      where: { branchId: shift.branchId, createdAt: { gte: shift.openedAt }, status: 'cancelled' },
    });

    const totalCash = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const totalCard = paidOrders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const totalOnline = paidOrders.filter(o => o.paymentMethod === 'online').reduce((s, o) => s + o.total, 0);
    const totalTips = paidOrders.reduce((s, o) => s + (o.tip ?? 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount ?? 0) + (o.promoDiscount ?? 0), 0);
    const totalRevenue = totalCash + totalCard + totalOnline;

    // Orta hazırlama vaxtı
    const prepTimes = orders.filter(o => o.preparationDuration != null).map(o => o.preparationDuration!);
    const avgPrepTime = prepTimes.length > 0
      ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
      : 0;

    // Ən çox satan məhsullar
    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.product?.nameAz ?? 'Bilinmir';
        if (!productCounts[item.productId]) productCounts[item.productId] = { name, count: 0, revenue: 0 };
        productCounts[item.productId].count += item.quantity;
        productCounts[item.productId].revenue += item.totalPrice;
      });
    });
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([productId, data]) => ({ productId, ...data }));

    // Saatlara görə sifariş paylanması
    const hourlyBreakdown: Record<number, number> = {};
    orders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      hourlyBreakdown[hour] = (hourlyBreakdown[hour] ?? 0) + 1;
    });

    const expectedCash = shift.openingCash + totalCash;
    const cashDifference = totalCash - expectedCash + shift.openingCash;

    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closedById: userId,
        totalCash,
        totalCard,
        totalOnline,
        totalRevenue,
        totalTips,
        totalDiscount,
        cashDifference,
        totalOrders: paidOrders.length,
        cancelledOrders: cancelledCount,
        avgPrepTime,
        topProducts,
        hourlyBreakdown,
        notes,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// Smena hesabatını ətraflı al
router.get('/:id/report', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });
    if (!shift) return res.status(404).json({ success: false, message: 'Smena tapılmadı' });

    // Həmin smena dövrünün sifarişlərini yüklə
    const endTime = shift.closedAt ?? new Date();
    const orders = await prisma.order.findMany({
      where: {
        branchId: shift.branchId,
        createdAt: { gte: shift.openedAt, lte: endTime },
      },
      include: {
        table: { select: { number: true } },
        items: { include: { product: { select: { nameAz: true, price: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: { shift, orders } });
  } catch (err) { next(err); }
});

// Ümumi hesabat — tarix aralığına görə
router.get('/reports/range', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, from, to } = req.query;
    if (!branchId || !from || !to) {
      return res.status(400).json({ success: false, message: 'branchId, from, to tələb olunur' });
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const [orders, shifts] = await Promise.all([
      prisma.order.findMany({
        where: {
          branchId: branchId as string,
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: {
          items: { include: { product: { select: { nameAz: true } } } },
        },
      }),
      prisma.shift.findMany({
        where: {
          branchId: branchId as string,
          openedAt: { gte: fromDate, lte: toDate },
        },
        include: {
          openedBy: { select: { id: true, name: true } },
          closedBy: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'asc' },
      }),
    ]);

    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
    const totalCash = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const totalCard = paidOrders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const totalOnline = paidOrders.filter(o => o.paymentMethod === 'online').reduce((s, o) => s + o.total, 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount ?? 0) + (o.promoDiscount ?? 0), 0);
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        const name = item.product?.nameAz ?? 'Bilinmir';
        if (!productCounts[item.productId]) productCounts[item.productId] = { name, count: 0, revenue: 0 };
        productCounts[item.productId].count += item.quantity;
        productCounts[item.productId].revenue += item.totalPrice;
      });
    });
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([productId, data]) => ({ productId, ...data }));

    // Günlük breakdown
    const dailyBreakdown: Record<string, { orders: number; revenue: number }> = {};
    paidOrders.forEach(o => {
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      if (!dailyBreakdown[day]) dailyBreakdown[day] = { orders: 0, revenue: 0 };
      dailyBreakdown[day].orders++;
      dailyBreakdown[day].revenue += o.total;
    });

    res.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        summary: {
          totalOrders: paidOrders.length,
          cancelledOrders: cancelledCount,
          totalRevenue,
          totalCash,
          totalCard,
          totalOnline,
          totalDiscount,
          avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
        },
        topProducts,
        dailyBreakdown,
        shifts,
      },
    });
  } catch (err) { next(err); }
});

// ── XLSX Export ──────────────────────────────────────────────────────────────
router.get('/reports/export/xlsx', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, from, to } = req.query;
    if (!branchId || !from || !to) {
      return res.status(400).json({ success: false, message: 'branchId, from, to tələb olunur' });
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const [orders, topRaw] = await Promise.all([
      prisma.order.findMany({
        where: {
          branchId: branchId as string,
          createdAt: { gte: fromDate, lte: toDate },
          status: { not: 'cancelled' },
        },
        include: { table: { select: { number: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.$queryRaw<{ name: string; count: number; revenue: number }[]>`
        SELECT p."nameAz" as name,
               COUNT(oi.id)::int as count,
               SUM(oi."totalPrice")::float as revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o."branchId" = ${branchId}
          AND o."createdAt" >= ${fromDate}
          AND o."createdAt" <= ${toDate}
        GROUP BY p.id, p."nameAz"
        ORDER BY count DESC
        LIMIT 20
      `,
    ]);

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalCash    = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const totalCard    = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const totalOnline  = orders.filter(o => ['online', 'payriff', 'm10'].includes(o.paymentMethod)).reduce((s, o) => s + o.total, 0);

    const dailyBreakdown: Record<string, { orders: number; revenue: number }> = {};
    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[key]) dailyBreakdown[key] = { orders: 0, revenue: 0 };
      dailyBreakdown[key].orders++;
      dailyBreakdown[key].revenue += o.total;
    }

    const buffer = await generateRangeReportXLSX({
      title: 'FoodZone Gəlir Hesabatı',
      dateRange: { from: from as string, to: to as string },
      summary: {
        'Ümumi sifariş': orders.length,
        'Cəmi gəlir': `${totalRevenue.toFixed(2)} ₼`,
        'Nağd': `${totalCash.toFixed(2)} ₼`,
        'Kart': `${totalCard.toFixed(2)} ₼`,
        'Online': `${totalOnline.toFixed(2)} ₼`,
        'Orta çek': orders.length ? `${(totalRevenue / orders.length).toFixed(2)} ₼` : '0.00 ₼',
      },
      orders,
      topProducts: topRaw,
      dailyBreakdown,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="foodzone-report-${from}-${to}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
});

export { router as shiftRoutes };
