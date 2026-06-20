import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router({ mergeParams: true });

router.get('/:branchId/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { branchId: req.params.branchId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.get('/:branchId/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, status: 'active' },
      include: {
        sizes: true,
        extras: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.get('/:branchId/products/popular', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, status: 'active', isPopular: true },
      include: { sizes: true, extras: true },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch popular products' });
  }
});

export { router as menuRoutes };
