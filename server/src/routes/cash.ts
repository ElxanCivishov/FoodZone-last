import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Aktiv açıq kassa
router.get('/active', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const drawer = await prisma.cashDrawer.findFirst({
      where: { branchId: branchId as string, status: 'open' },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    res.json({ success: true, data: drawer });
  } catch (err) { next(err); }
});

// Kassaları siyahısı
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, page = '1', limit = '20' } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const skip = (Number(page) - 1) * Number(limit);
    const [drawers, total] = await Promise.all([
      prisma.cashDrawer.findMany({
        where: { branchId: branchId as string },
        include: {
          openedBy: { select: { id: true, name: true } },
          closedBy: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.cashDrawer.count({ where: { branchId: branchId as string } }),
    ]);

    res.json({ success: true, data: drawers, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// Kassa aç
router.post('/open', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId, openingCash } = req.body;
    const userId = (req as any).user?.id;

    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const existing = await prisma.cashDrawer.findFirst({
      where: { branchId, status: 'open' },
    });
    if (existing) return res.status(400).json({ success: false, message: 'Artıq açıq kassa var' });

    const drawer = await prisma.cashDrawer.create({
      data: {
        branchId,
        openedById: userId,
        openingCash: openingCash ?? 0,
        status: 'open',
      },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'cash_drawer.open',
        entityType: 'CashDrawer',
        entityId: drawer.id,
        newValues: { openingCash: drawer.openingCash },
      },
    }).catch(() => {});

    res.status(201).json({ success: true, data: drawer });
  } catch (err) { next(err); }
});

// Kassa bağla
router.post('/:id/close', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { actualCash, notes } = req.body;
    const userId = (req as any).user?.id;

    const drawer = await prisma.cashDrawer.findUnique({ where: { id: req.params.id } });
    if (!drawer) return res.status(404).json({ success: false, message: 'Kassa tapılmadı' });
    if (drawer.status !== 'open') return res.status(400).json({ success: false, message: 'Kassa artıq bağlıdır' });

    // Bu kassaya aid ödənişlər hesabla
    const orders = await prisma.order.findMany({
      where: { cashDrawerId: drawer.id, paymentStatus: 'paid' },
      select: { paymentMethod: true, total: true, tip: true },
    });

    const totalCash = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const totalCard = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const totalOnline = orders.filter(o => o.paymentMethod === 'online').reduce((s, o) => s + o.total, 0);
    const totalTips = orders.reduce((s, o) => s + (o.tip ?? 0), 0);
    const expectedCash = drawer.openingCash + totalCash;
    const difference = actualCash !== undefined ? actualCash - expectedCash : undefined;

    const updated = await prisma.cashDrawer.update({
      where: { id: drawer.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closedById: userId,
        totalCash,
        totalCard,
        totalOnline,
        totalTips,
        expectedCash,
        actualCash: actualCash ?? undefined,
        difference,
        notes,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'cash_drawer.close',
        entityType: 'CashDrawer',
        entityId: drawer.id,
        newValues: { totalCash, totalCard, totalOnline, expectedCash, actualCash, difference },
      },
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// Kassanın ətraflı məlumatı (orders ilə birlikdə)
router.get('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const drawer = await prisma.cashDrawer.findUnique({
      where: { id: req.params.id },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        orders: {
          select: {
            id: true, orderNumber: true, total: true, tip: true,
            paymentMethod: true, paymentStatus: true, paidAt: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!drawer) return res.status(404).json({ success: false, message: 'Kassa tapılmadı' });
    res.json({ success: true, data: drawer });
  } catch (err) { next(err); }
});

export { router as cashRoutes };
