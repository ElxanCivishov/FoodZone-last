import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { staffCreateSchema } from '../lib/validation';

const router = Router();

router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 10)));
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '');
    const status = String(req.query.status || '');
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'all') where.role = role;
    if (status && status !== 'all') where.status = status;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: users,
        total,
        page,
        limit,
      },
    });
  } catch (err) { next(err); }
});

router.get('/all', authenticate, authorize(['admin', 'manager']), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize(['admin']), validate(staffCreateSchema), async (req, res, next) => {
  try {
    const { email, password, name, role, status } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role, status: status || 'active' },
    });
    res.status(201).json({ success: true, data: { id: user.id, name, email, role, status: user.status } });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { name, email, password, role, status } = req.body;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (password) {
      const bcrypt = await import('bcryptjs');
      data.password = await bcrypt.hash(password, 12);
    }
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
});

// ─── Həftəlik smena cədvəli ───────────────────────────────────────────────────

router.get('/schedule', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, from, to } = req.query as Record<string, string>;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId required' });

    const start = from ? new Date(from) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay() + 1); return d; })();
    const end = to ? new Date(to) : new Date(start.getTime() + 6 * 86400000);
    end.setHours(23, 59, 59, 999);

    const shifts = await (prisma as any).staffShift.findMany({
      where: { branchId, date: { gte: start, lte: end } },
      include: {
        user: { select: { id: true, name: true, role: true } },
        performance: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: shifts });
  } catch (err) { next(err); }
});

router.post('/schedule', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, userId, date, notes } = req.body;
    if (!branchId || !userId || !date) return res.status(400).json({ success: false, message: 'branchId, userId, date required' });

    const existing = await (prisma as any).staffShift.findFirst({
      where: { branchId, userId, date: new Date(date) },
    });
    if (existing) return res.status(409).json({ success: false, message: 'Bu gün üçün cədvəl artıq mövcuddur' });

    const shift = await (prisma as any).staffShift.create({
      data: { branchId, userId, date: new Date(date), notes, status: 'scheduled' },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json({ success: true, data: shift });
  } catch (err) { next(err); }
});

router.delete('/schedule/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await (prisma as any).staffShift.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Check-in / Check-out ─────────────────────────────────────────────────────

router.post('/schedule/:id/checkin', authenticate, async (req, res, next) => {
  try {
    const shift = await (prisma as any).staffShift.update({
      where: { id: req.params.id },
      data: { checkIn: new Date(), status: 'present' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
});

router.post('/schedule/:id/checkout', authenticate, async (req, res, next) => {
  try {
    const existing = await (prisma as any).staffShift.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Tapılmadı' });

    const checkOut = new Date();
    const checkIn = existing.checkIn ? new Date(existing.checkIn) : null;

    // Auto-compute performance: count paid orders by this user during shift period
    const ordersServed = checkIn ? await prisma.order.count({
      where: {
        branchId: existing.branchId,
        paidById: existing.userId,
        paidAt: { gte: checkIn, lte: checkOut },
      },
    }) : 0;

    const tipsSum = checkIn ? await prisma.order.aggregate({
      where: {
        branchId: existing.branchId,
        paidById: existing.userId,
        paidAt: { gte: checkIn, lte: checkOut },
      },
      _sum: { tip: true },
    }) : null;

    const [shift] = await prisma.$transaction([
      (prisma as any).staffShift.update({
        where: { id: req.params.id },
        data: { checkOut, status: 'completed' },
      }),
    ]);

    // Upsert performance record
    await (prisma as any).staffPerformance.upsert({
      where: { staffShiftId: req.params.id },
      create: {
        staffShiftId: req.params.id,
        userId: existing.userId,
        branchId: existing.branchId,
        ordersServed,
        tips: tipsSum?._sum?.tip ?? 0,
      },
      update: {
        ordersServed,
        tips: tipsSum?._sum?.tip ?? 0,
      },
    });

    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// ─── Performans & Leaderboard ─────────────────────────────────────────────────

router.get('/performance', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, period = 'today' } = req.query as Record<string, string>;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId required' });

    const now = new Date();
    const start = new Date(now);
    if (period === 'today') { start.setHours(0, 0, 0, 0); }
    else if (period === 'week') { start.setDate(now.getDate() - 7); }
    else if (period === 'month') { start.setDate(now.getDate() - 30); }

    const performance = await (prisma as any).staffPerformance.findMany({
      where: { branchId, createdAt: { gte: start } },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { ordersServed: 'desc' },
    });
    res.json({ success: true, data: performance });
  } catch (err) { next(err); }
});

router.get('/leaderboard', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, period = 'week' } = req.query as Record<string, string>;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId required' });

    const now = new Date();
    const start = new Date(now);
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'month') start.setDate(now.getDate() - 30);

    // Aggregate by user
    const rows = await (prisma as any).staffPerformance.groupBy({
      by: ['userId'],
      where: { branchId, createdAt: { gte: start } },
      _sum: { ordersServed: true, tips: true },
      _avg: { rating: true, avgServiceTime: true },
      _count: { staffShiftId: true },
      orderBy: { _sum: { ordersServed: 'desc' } },
    });

    const userIds = rows.map((r: any) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const leaderboard = rows.map((r: any, i: number) => ({
      rank: i + 1,
      user: userMap[r.userId],
      ordersServed: r._sum.ordersServed ?? 0,
      tips: r._sum.tips ?? 0,
      avgRating: r._avg.rating ?? null,
      avgServiceTime: r._avg.avgServiceTime ?? null,
      shiftsWorked: r._count.staffShiftId,
    }));

    res.json({ success: true, data: leaderboard });
  } catch (err) { next(err); }
});

// ─── İşçinin öz cədvəli (auth yoxlamadan — öz cədvəlini görür) ───────────────

router.get('/my-schedule', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const days = Number(req.query.days || 14);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now.getTime() + days * 86400000);

    const shifts = await (prisma as any).staffShift.findMany({
      where: { userId, date: { gte: now, lte: end } },
      orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: shifts });
  } catch (err) { next(err); }
});

export { router as staffRoutes };
