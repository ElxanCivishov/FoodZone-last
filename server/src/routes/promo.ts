import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// ── Statistika ──────────────────────────────────────────────────────────────
router.get('/stats', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [orderAgg, monthAgg, activeCount, expiredCount, topCodes] = await Promise.all([
      prisma.order.aggregate({
        where: { branchId: branchId as string, promoCodeId: { not: null } },
        _sum: { promoDiscount: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { branchId: branchId as string, promoCodeId: { not: null }, createdAt: { gte: monthStart } },
        _sum: { promoDiscount: true },
        _count: { id: true },
      }),
      prisma.promoCode.count({
        where: { branchId: branchId as string, status: 'active', validTo: { gte: now } },
      }),
      prisma.promoCode.count({
        where: { branchId: branchId as string, validTo: { lt: now } },
      }),
      prisma.promoCode.findMany({
        where: { branchId: branchId as string, usedCount: { gt: 0 } },
        orderBy: { usedCount: 'desc' },
        take: 5,
        select: { id: true, code: true, type: true, value: true, usedCount: true, description: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalDiscountGiven: orderAgg._sum.promoDiscount ?? 0,
        totalOrdersWithPromo: orderAgg._count.id,
        monthDiscountGiven: monthAgg._sum.promoDiscount ?? 0,
        monthOrdersWithPromo: monthAgg._count.id,
        activeCount,
        expiredCount,
        topCodes,
      },
    });
  } catch (err) { next(err); }
});

// ── Siyahı ──────────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const codes = await prisma.promoCode.findMany({
      where: { branchId: branchId as string },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    const now = new Date();
    const withStatus = codes.map(c => ({
      ...c,
      isExpired: c.validTo < now,
      isMaxed: c.maxUses !== null && c.usedCount >= c.maxUses,
    }));

    res.json({ success: true, data: withStatus });
  } catch (err) { next(err); }
});

// ── Yarat ───────────────────────────────────────────────────────────────────
router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const {
      branchId, code, description, type, value,
      minOrderAmount, maxUses, validFrom, validTo,
      customerId, applicableItems, happyHourStart, happyHourEnd, daysOfWeek,
    } = req.body;

    if (!branchId || !code || !type || value === undefined || !validFrom || !validTo) {
      return res.status(400).json({ success: false, message: 'Bütün tələb olunan sahələri doldurun' });
    }

    const existing = await prisma.promoCode.findUnique({ where: { branchId_code: { branchId, code: code.toUpperCase() } } });
    if (existing) return res.status(400).json({ success: false, message: 'Bu kod artıq mövcuddur' });

    const promo = await prisma.promoCode.create({
      data: {
        branchId,
        code: code.toUpperCase(),
        description: description || undefined,
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        customerId: customerId || undefined,
        applicableItems: Array.isArray(applicableItems) ? applicableItems : [],
        happyHourStart: happyHourStart || undefined,
        happyHourEnd: happyHourEnd || undefined,
        daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek.map(Number) : [],
      },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });

    res.status(201).json({ success: true, data: promo });
  } catch (err) { next(err); }
});

// ── Doğrula ─────────────────────────────────────────────────────────────────
router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { branchId, code, orderAmount, customerId, itemIds } = req.body;

    if (!branchId || !code) {
      return res.status(400).json({ success: false, message: 'branchId və code tələb olunur' });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { branchId_code: { branchId, code: code.toUpperCase() } },
    });

    if (!promo) return res.status(404).json({ success: false, message: 'Kod tapılmadı' });
    if (promo.status !== 'active') return res.status(400).json({ success: false, message: 'Kod aktiv deyil' });

    const now = new Date();
    if (promo.validFrom > now) return res.status(400).json({ success: false, message: 'Kod hələ aktiv olmayıb' });
    if (promo.validTo < now) return res.status(400).json({ success: false, message: 'Kodun müddəti bitib' });
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'Kod istifadə limitinə çatıb' });
    }

    // Şəxsi kod yoxlaması
    if (promo.customerId && promo.customerId !== customerId) {
      return res.status(400).json({ success: false, message: 'Bu kod başqa müştəriyə məxsusdur' });
    }

    // Həftənin günü yoxlaması
    if (promo.daysOfWeek.length > 0) {
      const todayDay = now.getDay();
      if (!promo.daysOfWeek.includes(todayDay)) {
        const dayNames = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
        const validDays = promo.daysOfWeek.map(d => dayNames[d]).join(', ');
        return res.status(400).json({ success: false, message: `Bu kod yalnız ${validDays} günlərində keçərlidir` });
      }
    }

    // Happy Hour yoxlaması
    if (promo.happyHourStart && promo.happyHourEnd) {
      const [startH, startM] = promo.happyHourStart.split(':').map(Number);
      const [endH, endM] = promo.happyHourEnd.split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return res.status(400).json({
          success: false,
          message: `Bu kod yalnız ${promo.happyHourStart}–${promo.happyHourEnd} saatları arası keçərlidir`,
        });
      }
    }

    // Tətbiq olunan məhsullar yoxlaması
    if (promo.applicableItems.length > 0 && Array.isArray(itemIds) && itemIds.length > 0) {
      const hasMatch = itemIds.some((id: string) => promo.applicableItems.includes(id));
      if (!hasMatch) {
        return res.status(400).json({ success: false, message: 'Bu kod seçilmiş məhsullara tətbiq olunmur' });
      }
    }

    // Minimum məbləğ yoxlaması
    if (promo.minOrderAmount && orderAmount && Number(orderAmount) < promo.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum sifariş məbləği ${promo.minOrderAmount} ₼ olmalıdır`,
      });
    }

    let discountAmount = 0;
    if (promo.type === 'percent') {
      discountAmount = orderAmount ? (Number(orderAmount) * promo.value) / 100 : 0;
    } else if (promo.type === 'fixed') {
      discountAmount = promo.value;
    }

    res.json({ success: true, data: { promo, discountAmount, valid: true } });
  } catch (err) { next(err); }
});

// ── Redaktə ─────────────────────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const {
      description, status, maxUses, validTo, value,
      happyHourStart, happyHourEnd, daysOfWeek, applicableItems, customerId,
    } = req.body;

    const data: any = {};
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (maxUses !== undefined) data.maxUses = Number(maxUses);
    if (validTo !== undefined) data.validTo = new Date(validTo);
    if (value !== undefined) data.value = Number(value);
    if (happyHourStart !== undefined) data.happyHourStart = happyHourStart || null;
    if (happyHourEnd !== undefined) data.happyHourEnd = happyHourEnd || null;
    if (daysOfWeek !== undefined) data.daysOfWeek = Array.isArray(daysOfWeek) ? daysOfWeek.map(Number) : [];
    if (applicableItems !== undefined) data.applicableItems = Array.isArray(applicableItems) ? applicableItems : [];
    if (customerId !== undefined) data.customerId = customerId || null;

    const promo = await prisma.promoCode.update({
      where: { id: req.params.id },
      data,
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
    res.json({ success: true, data: promo });
  } catch (err) { next(err); }
});

// ── Sil ─────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Kod silindi' });
  } catch (err) { next(err); }
});

export { router as promoRoutes };
