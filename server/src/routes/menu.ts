import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router({ mergeParams: true });

// Get branch details
router.get('/:branchId', async (req, res, next) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.branchId, status: 'active' },
      include: { 
        restaurant: { select: { id: true, name: true, logo: true } },
        tables: { where: { status: 'active' }, select: { id: true, number: true, capacity: true } },
      },
    });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) { next(err); }
});

// Get categories by branch
router.get('/:branchId/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { branchId: req.params.branchId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

// Get products by branch
router.get('/:branchId/products', async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const where: any = { branchId: req.params.branchId, status: 'active' };
    if (categoryId) where.categoryId = categoryId as string;

    const products = await prisma.product.findMany({
      where,
      include: {
        sizes: true,
        extras: true,
        category: { select: { id: true, name: true, nameAz: true, nameEn: true, nameRu: true, nameTr: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

// Get popular products by branch
router.get('/:branchId/products/popular', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, status: 'active', isPopular: true },
      include: { sizes: true, extras: true, category: { select: { id: true, name: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

export { router as menuRoutes };
