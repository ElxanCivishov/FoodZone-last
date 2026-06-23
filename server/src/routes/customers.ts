import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const clean = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : (v ?? null));

// ─── Sabit path-lar /:id-dən ƏVVƏL gəlməlidir ────────────────────────────────

// CRM statistika
router.get('/stats', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const [total, vipCount, agg, birthdayToday] = await Promise.all([
      prisma.customer.count({ where: { branchId: branchId as string } }),
      prisma.customer.count({ where: { branchId: branchId as string, tags: { has: 'VIP' } } }),
      prisma.customer.aggregate({
        where: { branchId: branchId as string },
        _sum: { totalSpent: true, points: true },
        _avg: { totalSpent: true },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM "Customer"
        WHERE "branchId" = ${branchId as string}
        AND "birthDate" IS NOT NULL
        AND EXTRACT(MONTH FROM "birthDate") = ${month}
        AND EXTRACT(DAY FROM "birthDate") = ${day}
      `.then(r => Number(r[0]?.count ?? 0)).catch(() => 0),
    ]);

    res.json({
      success: true,
      data: {
        total,
        vipCount,
        totalSpent: agg._sum.totalSpent ?? 0,
        avgSpend: agg._avg.totalSpent ?? 0,
        totalPoints: agg._sum.points ?? 0,
        birthdayToday,
      },
    });
  } catch (err) { next(err); }
});

// Telefon nömrəsi ilə axtar
router.get('/lookup/phone', authenticate, async (req, res, next) => {
  try {
    const { branchId, phone } = req.query;
    if (!branchId || !phone) return res.status(400).json({ success: false, message: 'branchId və phone tələb olunur' });

    const customer = await prisma.customer.findFirst({
      where: { branchId: branchId as string, phone: phone as string },
    });

    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
});

// ─── Ümumi siyahı ─────────────────────────────────────────────────────────────

router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, search, page = '1', limit = '20' } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { totalSpent: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ success: true, data: customers, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// ─── Yeni müştəri ─────────────────────────────────────────────────────────────

router.post('/', authenticate, authorize(['admin', 'manager', 'waiter']), async (req, res, next) => {
  try {
    const { branchId, name, tags, birthDate } = req.body;
    if (!branchId || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'branchId və name tələb olunur' });
    }

    const phone = clean(req.body.phone) as string | null;
    const email = clean(req.body.email) as string | null;
    const notes = clean(req.body.notes) as string | null;

    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { branchId, phone } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Bu nömrə ilə müştəri artıq mövcuddur', data: existing });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        branchId,
        name: name.trim(),
        phone,
        email,
        notes,
        tags: Array.isArray(tags) ? tags : [],
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Bu telefon nömrəsi artıq qeydiyyatdadır' });
    }
    next(err);
  }
});

// ─── Müştəri ətraflı + sifariş tarixi ────────────────────────────────────────

router.get('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          select: { id: true, orderNumber: true, total: true, paymentMethod: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Müştəri tapılmadı' });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
});

// ─── Müştərinin sevimli məhsulları ───────────────────────────────────────────

router.get('/:id/favorites', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { customerId: req.params.id } },
      _count: { productId: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 6,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, name: true, nameAz: true, image: true, price: true },
    });

    const favorites = items.map(i => ({
      ...products.find(p => p.id === i.productId),
      orderCount: i._count.productId,
      totalSpent: i._sum.totalPrice ?? 0,
    }));

    res.json({ success: true, data: favorites });
  } catch (err) { next(err); }
});

// ─── Müştərinin feedback-ları ─────────────────────────────────────────────────

router.get('/:id/feedback', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const feedbacks = await (prisma as any).customerFeedback.findMany({
      where: { customerId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((s: number, f: any) => s + f.rating, 0) / feedbacks.length).toFixed(1)
      : null;
    res.json({ success: true, data: feedbacks, avgRating });
  } catch (err) { next(err); }
});

// ─── Müştəri yenilə ──────────────────────────────────────────────────────────

router.patch('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { name, tags, birthDate } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (req.body.phone !== undefined) data.phone = clean(req.body.phone);
    if (req.body.email !== undefined) data.email = clean(req.body.email);
    if (req.body.notes !== undefined) data.notes = clean(req.body.notes);
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;

    const customer = await prisma.customer.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: customer });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Bu telefon nömrəsi artıq qeydiyyatdadır' });
    }
    next(err);
  }
});

// ─── Ballar əlavə et / çıxar ─────────────────────────────────────────────────

router.post('/:id/points', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (amount === undefined) return res.status(400).json({ success: false, message: 'amount tələb olunur' });

    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Müştəri tapılmadı' });

    const newPoints = Math.max(0, customer.points + Number(amount));
    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { points: newPoints },
    });

    res.json({ success: true, data: updated, message: `Bal ${Number(amount) > 0 ? 'əlavə edildi' : 'çıxarıldı'}` });
  } catch (err) { next(err); }
});

// ─── Müştəri sil (soft delete) ────────────────────────────────────────────────

router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await prisma.customer.update({
      where: { id: req.params.id },
      data: { phone: null, email: null, name: 'Silinmiş müştəri' },
    });
    res.json({ success: true, message: 'Müştəri məlumatları silindi' });
  } catch (err) { next(err); }
});

export { router as customerRoutes };
