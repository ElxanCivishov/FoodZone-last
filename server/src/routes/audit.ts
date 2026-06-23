import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Audit log siyahısı
router.get('/', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { userId, action, entityType, page = '1', limit = '50', from, to } = req.query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action as string };
    if (entityType) where.entityType = entityType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

export { router as auditRoutes };
