import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { notify } from '../lib/notify';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Siyahı
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, filter, category } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId, status: 'active' };
    if (category) where.category = category;

    const materials = await prisma.rawMaterial.findMany({
      where,
      include: { _count: { select: { ingredients: true } } },
      orderBy: [{ category: 'asc' }, { nameAz: 'asc' }],
    });

    const withStatus = materials.map(m => ({
      ...m,
      stockStatus: m.currentStock <= 0 ? 'out' : m.currentStock <= m.minStock ? 'low' : 'ok',
    }));

    const result = filter === 'low'
      ? withStatus.filter(m => m.stockStatus === 'low' || m.stockStatus === 'out')
      : withStatus;

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Yarat
router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const material = await prisma.rawMaterial.create({ data: req.body });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
});

// Yenilə
router.patch('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const material = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
});

// Sil (soft delete)
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.rawMaterial.update({ where: { id: req.params.id }, data: { status: 'inactive' } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Stok hərəkəti (giriş/çıxış)
router.post('/:id/movement', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { type, quantity, unitCost, note, createdById } = req.body;
    const material = await prisma.rawMaterial.findUnique({ where: { id: req.params.id } });
    if (!material) return res.status(404).json({ success: false, message: 'Tapılmadı' });

    const delta = (type === 'purchase' || type === 'adjustment')
      ? Math.abs(quantity)
      : -Math.abs(quantity);
    const newStock = material.currentStock + delta;

    await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id: req.params.id },
        data: { currentStock: newStock, ...(unitCost ? { costPerUnit: unitCost } : {}) },
      }),
      prisma.rawMovement.create({
        data: {
          rawMaterialId: req.params.id,
          branchId: material.branchId,
          type,
          quantity: delta,
          unitCost,
          note,
          createdById,
        },
      }),
    ]);

    if (newStock <= material.minStock && newStock > 0) {
      await notify({
        io: (req as any).io,
        branchId: material.branchId,
        type: 'low_stock',
        title: 'Xammal azalır',
        message: `${material.nameAz} — ${newStock.toFixed(2)} ${material.unit} qaldı`,
        data: { rawMaterialId: material.id },
      }).catch(() => {});
    }

    res.json({ success: true, data: { newStock } });
  } catch (err) { next(err); }
});

// Hərəkət tarixi
router.get('/:id/movements', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const movements = await prisma.rawMovement.findMany({
      where: { rawMaterialId: req.params.id },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    res.json({ success: true, data: movements });
  } catch (err) { next(err); }
});

// Kateqoriyalar siyahısı
router.get('/categories', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });
    const cats = await prisma.rawMaterial.findMany({
      where: { branchId: branchId as string, status: 'active', category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    res.json({ success: true, data: cats.map(c => c.category).filter(Boolean) });
  } catch (err) { next(err); }
});

export { router as rawMaterialRoutes };
