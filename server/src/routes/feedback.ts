import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Filial rəyləri siyahısı + ortalama
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, page = '1', limit = '20', rating } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId };
    if (rating) where.rating = Number(rating);

    const skip = (Number(page) - 1) * Number(limit);
    const [feedbacks, total, agg] = await Promise.all([
      (prisma as any).customerFeedback.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      (prisma as any).customerFeedback.count({ where }),
      (prisma as any).customerFeedback.aggregate({ where: { branchId }, _avg: { rating: true }, _count: true }),
    ]);

    const distribution = await Promise.all(
      [1, 2, 3, 4, 5].map(async r => ({
        rating: r,
        count: await (prisma as any).customerFeedback.count({ where: { branchId, rating: r } }),
      }))
    );

    res.json({
      success: true,
      data: feedbacks,
      total,
      avgRating: agg._avg?.rating ? Number(agg._avg.rating).toFixed(1) : null,
      totalCount: agg._count,
      distribution,
    });
  } catch (err) { next(err); }
});

// Rəy yarat
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { branchId, customerId, orderId, rating, comment } = req.body;
    if (!branchId || !rating) return res.status(400).json({ success: false, message: 'branchId və rating tələb olunur' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1-5 arasında olmalıdır' });

    const feedback = await (prisma as any).customerFeedback.create({
      data: {
        branchId,
        customerId: customerId || null,
        orderId: orderId || null,
        rating: Number(rating),
        comment: comment?.trim() || null,
      },
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (err) { next(err); }
});

// Rəy sil
router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await (prisma as any).customerFeedback.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Rəy silindi' });
  } catch (err) { next(err); }
});

export { router as feedbackRoutes };
