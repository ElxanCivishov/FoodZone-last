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
    const { status, capacity } = req.body;
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
      },
      include: { branch: true },
    });
    (req as any).io?.to('admin').emit('qr:changed', { tableId: table.id });
    res.json({ success: true, data: table });
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
