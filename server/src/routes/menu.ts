import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize(['admin', 'manager']), async (_req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      include: { restaurant: true, tables: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: branches });
  } catch (err) { next(err); }
});

router.post('/:branchId/products', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      nameAz,
      nameEn,
      nameRu,
      nameTr,
      description,
      price,
      image,
      sortOrder,
      status,
      isPopular,
    } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, branchId: req.params.branchId },
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const product = await prisma.product.create({
      data: {
        categoryId,
        name,
        nameAz: nameAz || name,
        nameEn: nameEn || name,
        nameRu: nameRu || name,
        nameTr: nameTr || name,
        description,
        price: Number(price),
        image,
        sortOrder: Number(sortOrder || 0),
        status: status || 'active',
        isPopular: Boolean(isPopular),
      },
      include: { category: true, sizes: true, extras: true },
    });

    (req as any).io?.to('admin').emit('menu:changed', { action: 'created', product });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.patch('/products/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const allowed = [
      'categoryId', 'name', 'nameAz', 'nameEn', 'nameRu', 'nameTr',
      'description', 'descriptionAz', 'descriptionEn', 'descriptionRu', 'descriptionTr',
      'price', 'image', 'sortOrder', 'status', 'isPopular',
    ];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { category: true, sizes: true, extras: true },
    });

    (req as any).io?.to('admin').emit('menu:changed', { action: 'updated', product });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.delete('/products/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    (req as any).io?.to('admin').emit('menu:changed', { action: 'deleted', id: req.params.id });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
});

router.get('/:branchId', async (req, res, next) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.branchId },
      include: { restaurant: true, categories: { include: { products: true } } },
    });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) { next(err); }
});

router.get('/:branchId/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { branchId: req.params.branchId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

router.get('/:branchId/products', async (req, res, next) => {
  try {
    const where: any = { category: { branchId: req.params.branchId }, status: 'active' };
    if (req.query.categoryId) where.categoryId = req.query.categoryId as string;
    const products = await prisma.product.findMany({
      where,
      include: { sizes: true, extras: true, category: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

router.get('/:branchId/products/popular', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { category: { branchId: req.params.branchId }, status: 'active', isPopular: true },
      include: { category: true },
    });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

router.get('/:branchId/rewards', async (_req, res, next) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { status: 'active' },
      orderBy: { pointsRequired: 'asc' },
    });
    res.json({ success: true, data: rewards });
  } catch (err) { next(err); }
});

router.post('/:branchId/categories', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { name, nameAz, nameEn, nameRu, nameTr, icon, sortOrder } = req.body;
    const category = await prisma.category.create({
      data: { name, nameAz, nameEn, nameRu, nameTr, icon, sortOrder, branchId: req.params.branchId },
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
});

router.patch('/categories/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { name, nameAz, nameEn, nameRu, nameTr, icon, sortOrder, status } = req.body;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (nameAz !== undefined) data.nameAz = nameAz;
    if (nameEn !== undefined) data.nameEn = nameEn;
    if (nameRu !== undefined) data.nameRu = nameRu;
    if (nameTr !== undefined) data.nameTr = nameTr;
    if (icon !== undefined) data.icon = icon;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (status !== undefined) data.status = status;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

router.delete('/categories/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

export { router as menuRoutes };
