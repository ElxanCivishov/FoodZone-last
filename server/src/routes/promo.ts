import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Promo kodlar siyahısı
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const codes = await prisma.promoCode.findMany({
      where: { branchId: branchId as string },
      orderBy: { createdAt: 'desc' },
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

// Promo kod yarat
router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, code, description, type, value, minOrderAmount, maxUses, validFrom, validTo } = req.body;

    if (!branchId || !code || !type || value === undefined || !validFrom || !validTo) {
      return res.status(400).json({ success: false, message: 'Bütün tələb olunan sahələri doldurun' });
    }

    const existing = await prisma.promoCode.findUnique({ where: { branchId_code: { branchId, code } } });
    if (existing) return res.status(400).json({ success: false, message: 'Bu kod artıq mövcuddur' });

    const promo = await prisma.promoCode.create({
      data: {
        branchId,
        code: code.toUpperCase(),
        description,
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
      },
    });

    res.status(201).json({ success: true, data: promo });
  } catch (err) { next(err); }
});

// Promo kodu yoxla (sifariş zamanı müştəri istifadə edir)
router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { branchId, code, orderAmount } = req.body;

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
    if (promo.minOrderAmount && orderAmount && Number(orderAmount) < promo.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum sifariş məbləği ${promo.minOrderAmount} ₼ olmalıdır`,
      });
    }

    // Endirim məbləğini hesabla
    let discountAmount = 0;
    if (promo.type === 'percent') {
      discountAmount = orderAmount ? (Number(orderAmount) * promo.value) / 100 : 0;
    } else if (promo.type === 'fixed') {
      discountAmount = promo.value;
    }

    res.json({
      success: true,
      data: { promo, discountAmount, valid: true },
    });
  } catch (err) { next(err); }
});

// Promo kod redaktə et
router.patch('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { description, status, maxUses, validTo, value } = req.body;
    const data: any = {};
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (maxUses !== undefined) data.maxUses = Number(maxUses);
    if (validTo !== undefined) data.validTo = new Date(validTo);
    if (value !== undefined) data.value = Number(value);

    const promo = await prisma.promoCode.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: promo });
  } catch (err) { next(err); }
});

// Promo kod sil
router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Kod silindi' });
  } catch (err) { next(err); }
});

export { router as promoRoutes };
