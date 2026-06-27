import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Sifariş məlumatlarını çap üçün hazırla
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where:   { id: req.params.orderId },
      include: {
        items:  { include: { product: true } },
        table:  { select: { number: true } },
        branch: { select: { name: true, restaurant: { select: { name: true } } } },
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Sifariş tapılmadı' });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// Printer status (LAN printer)
router.get('/status', authenticate, (_req, res) => {
  res.json({ success: true, data: { online: false, message: 'Network printer konfiqurasiya edilməyib' } });
});

export { router as printRoutes };
