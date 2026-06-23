import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import QRCode from 'qrcode';

const router = Router();

router.get('/tables', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const tables = await prisma.table.findMany({
      where: branchId ? { branchId } : {},
      include: { branch: { include: { restaurant: true } } },
      orderBy: { number: 'asc' },
    });
    res.json({ success: true, data: tables });
  } catch (err) { next(err); }
});

router.post('/tables', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, number, section, shape, capacity, posX, posY } = req.body;
    if (!branchId || !number) return res.status(400).json({ success: false, message: 'branchId and number required' });

    const existing = await prisma.table.findFirst({ where: { branchId, number: String(number) } });
    if (existing) return res.status(409).json({ success: false, message: `Masa ${number} artıq mövcuddur` });

    const table = await prisma.table.create({
      data: {
        branchId,
        number: String(number),
        qrCode: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        section: section ?? null,
        shape: shape ?? 'square',
        capacity: capacity ? Number(capacity) : null,
        posX: posX ? Number(posX) : null,
        posY: posY ? Number(posY) : null,
      },
    });
    res.status(201).json({ success: true, data: table });
  } catch (err) { next(err); }
});

router.post('/tables/:id/generate', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: req.params.id },
      include: { branch: { include: { restaurant: true } } },
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const qrPayload = JSON.stringify({
      tableId: table.id,
      branchId: table.branchId,
      restaurantId: table.branch.restaurantId,
      tableNumber: table.number,
    });
    const qrImage = await QRCode.toDataURL(qrPayload, { margin: 1, width: 360 });
    const updated = await prisma.table.update({
      where: { id: table.id },
      data: { qrCode: qrPayload },
      include: { branch: { include: { restaurant: true } } },
    });

    (req as any).io?.to('admin').emit('qr:changed', { tableId: table.id });
    res.json({ success: true, data: { ...updated, qrImage } });
  } catch (err) { next(err); }
});

router.patch('/tables/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { status, capacity, section, shape, posX, posY } = req.body;
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(section !== undefined && { section }),
        ...(shape !== undefined && { shape }),
        ...(posX !== undefined && { posX: Number(posX) }),
        ...(posY !== undefined && { posY: Number(posY) }),
      },
      include: { branch: true },
    });
    (req as any).io?.to('admin').emit('table:updated', { tableId: table.id });
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

// Masa birləşdirməsi: tableId → primaryTableId
router.post('/tables/:id/merge', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { primaryTableId } = req.body;
    if (!primaryTableId) return res.status(400).json({ success: false, message: 'primaryTableId required' });
    if (primaryTableId === req.params.id) return res.status(400).json({ success: false, message: 'Masa özü ilə birləşdirilə bilməz' });

    const primary = await prisma.table.findUnique({ where: { id: primaryTableId } });
    if (!primary) return res.status(404).json({ success: false, message: 'Əsas masa tapılmadı' });

    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { mergedWith: primaryTableId },
    });
    (req as any).io?.to('admin').emit('table:merged', { tableId: req.params.id, primaryTableId });
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

// Masa ayrılması
router.post('/tables/:id/unmerge', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { mergedWith: null },
    });
    (req as any).io?.to('admin').emit('table:unmerged', { tableId: req.params.id });
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

// Masa statistikası — orta oturma müddəti
router.get('/tables/stats', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query as Record<string, string>;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId required' });

    const tables = await prisma.table.findMany({
      where: { branchId },
      include: {
        orders: {
          where: { status: 'served', tableId: { not: null } },
          select: { createdAt: true, updatedAt: true, total: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
      orderBy: { number: 'asc' },
    });

    const stats = tables.map(table => {
      const completedOrders = table.orders.filter(o => o.updatedAt > o.createdAt);
      const avgDurationMs = completedOrders.length > 0
        ? completedOrders.reduce((s, o) => s + (o.updatedAt.getTime() - o.createdAt.getTime()), 0) / completedOrders.length
        : 0;
      const avgRevenue = completedOrders.length > 0
        ? completedOrders.reduce((s, o) => s + o.total, 0) / completedOrders.length
        : 0;

      return {
        tableId: table.id,
        number: table.number,
        section: table.section,
        status: table.status,
        capacity: table.capacity,
        mergedWith: table.mergedWith,
        totalOrders: completedOrders.length,
        avgDurationMin: Math.round(avgDurationMs / 60000),
        avgRevenue: Math.round(avgRevenue * 100) / 100,
      };
    });

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

router.post('/validate', async (req, res, next) => {
  try {
    const { qrData } = req.body;
    let data: any;
    try {
      data = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid QR data' });
    }
    const table = await prisma.table.findUnique({
      where: { id: data.tableId },
      include: { branch: { include: { restaurant: true } } },
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({
      success: true,
      data: {
        restaurantId: table.branch.restaurantId,
        branchId: table.branchId,
        tableId: table.id,
        tableNumber: table.number,
        branchName: table.branch.name,
        restaurantName: table.branch.restaurant.name,
        valid: true,
      },
    });
  } catch (err) { next(err); }
});

export { router as qrRoutes };
