import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Bildirişlər siyahısı
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, isRead, page = '1', limit = '30' } = req.query;

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    res.json({ success: true, data: notifications, total, unreadCount, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// Bildirişi oxunmuş işarələ
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
});

// Hamısını oxunmuş işarələ
router.patch('/mark-all-read', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.body;
    await prisma.notification.updateMany({
      where: { branchId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Hamısı oxundu' });
  } catch (err) { next(err); }
});

// Bildiriş sil
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Bildiriş silindi' });
  } catch (err) { next(err); }
});

// Köhnə bildirişləri təmizlə (30 gündən köhnə oxunmuşlar)
router.delete('/cleanup/old', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { branchId } = req.body;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        branchId,
        isRead: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    res.json({ success: true, message: `${result.count} bildiriş silindi` });
  } catch (err) { next(err); }
});

export { router as notificationRoutes };
