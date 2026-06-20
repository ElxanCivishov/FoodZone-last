import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { QRValidateSchema } from '../lib/validation';

const router = Router();

router.post('/validate', validate(QRValidateSchema), async (req, res, next) => {
  try {
    const { qrData } = req.body;
    const data = JSON.parse(qrData);

    if (!data.tableId) {
      return res.status(400).json({ success: false, valid: false, message: 'Invalid QR format' });
    }

    const table = await prisma.table.findUnique({
      where: { id: data.tableId },
      include: { branch: { include: { restaurant: true } } },
    });

    if (!table || table.status !== 'active') {
      return res.json({ success: false, valid: false, message: 'Invalid or inactive table' });
    }

    if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return res.json({ success: false, valid: false, expired: true, message: 'QR code has expired' });
    }

    res.json({
      success: true,
      valid: true,
      restaurantId: table.branch.restaurantId,
      branchId: table.branchId,
      tableId: table.id,
      tableNumber: table.number,
      restaurantName: table.branch.restaurant.name,
      branchName: table.branch.name,
      language: data.language || 'az',
    });
  } catch (err) { next(err); }
});

export { router as qrRoutes };
