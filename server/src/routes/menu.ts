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

router.patch('/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { name, address, phone, wifiName, wifiPassword } = req.body;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (wifiName !== undefined) data.wifiName = wifiName;
    if (wifiPassword !== undefined) data.wifiPassword = wifiPassword;
    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data,
      include: { restaurant: true, tables: true },
    });
    res.json({ success: true, data: branch });
  } catch (err) { next(err); }
});

router.patch('/:id/restaurant', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.id }, select: { restaurantId: true } });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    const { name, description } = req.body;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    const restaurant = await prisma.restaurant.update({ where: { id: branch.restaurantId }, data });
    res.json({ success: true, data: restaurant });
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

router.get('/:branchId/categories/admin', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { branchId: req.params.branchId },
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

router.patch('/:branchId/categories/reorder', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const ids: string[] = Array.isArray(req.body.ids) ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Category order is required' });

    const existing = await prisma.category.findMany({
      where: { branchId: req.params.branchId, id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'Invalid category order' });
    }

    await prisma.$transaction(
      ids.map((id, index) => prisma.category.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })),
    );

    const categories = await prisma.category.findMany({
      where: { branchId: req.params.branchId },
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    (req as any).io?.to('admin').emit('menu:changed', { action: 'category:reordered', categories });
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
    const { name, nameAz, nameEn, nameRu, nameTr, icon, sortOrder, status } = req.body;
    const order = sortOrder !== undefined
      ? Number(sortOrder)
      : ((await prisma.category.aggregate({
        where: { branchId: req.params.branchId },
        _max: { sortOrder: true },
      }))._max.sortOrder || 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        nameAz: nameAz || name,
        nameEn: nameEn || name,
        nameRu: nameRu || name,
        nameTr: nameTr || name,
        icon,
        sortOrder: order,
        status: status || 'active',
        branchId: req.params.branchId,
      },
      include: { _count: { select: { products: true } } },
    });
    (req as any).io?.to('admin').emit('menu:changed', { action: 'category:created', category });
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
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (status !== undefined) data.status = status;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
      include: { _count: { select: { products: true } } },
    });
    (req as any).io?.to('admin').emit('menu:changed', { action: 'category:updated', category });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

router.delete('/categories/:id', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (productCount > 0) {
      return res.status(400).json({ success: false, message: 'Category has products. Deactivate it or move products first.' });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    (req as any).io?.to('admin').emit('menu:changed', { action: 'category:deleted', id: req.params.id });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

// ─── Mərkəzi menyu → filial kopyalama ────────────────────────────────────────

router.post('/copy', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { sourceBranchId, targetBranchId, copyCategories = true, copyProducts = true, overwrite = false } = req.body;
    if (!sourceBranchId || !targetBranchId) {
      return res.status(400).json({ success: false, message: 'sourceBranchId and targetBranchId required' });
    }
    if (sourceBranchId === targetBranchId) {
      return res.status(400).json({ success: false, message: 'Mənbə və hədəf filial eyni ola bilməz' });
    }

    const sourceCategories = await prisma.category.findMany({
      where: { branchId: sourceBranchId, status: 'active' },
      include: { products: { where: { status: 'active' } } },
      orderBy: { sortOrder: 'asc' },
    });

    let categoriesCopied = 0;
    let productsCopied = 0;
    let categoriesSkipped = 0;
    let productsSkipped = 0;

    for (const srcCat of sourceCategories) {
      if (!copyCategories) break;

      // Eyni adda kateqoriya varmı?
      const existingCat = await prisma.category.findFirst({
        where: { branchId: targetBranchId, name: srcCat.name },
      });

      let targetCatId: string;

      if (existingCat) {
        if (!overwrite) { categoriesSkipped++; targetCatId = existingCat.id; }
        else {
          await prisma.category.update({
            where: { id: existingCat.id },
            data: { nameAz: srcCat.nameAz, nameEn: srcCat.nameEn, nameRu: srcCat.nameRu, nameTr: srcCat.nameTr, icon: srcCat.icon, sortOrder: srcCat.sortOrder },
          });
          categoriesCopied++;
          targetCatId = existingCat.id;
        }
      } else {
        const newCat = await prisma.category.create({
          data: {
            branchId: targetBranchId,
            name: srcCat.name, nameAz: srcCat.nameAz, nameEn: srcCat.nameEn,
            nameRu: srcCat.nameRu, nameTr: srcCat.nameTr,
            icon: srcCat.icon, sortOrder: srcCat.sortOrder,
          },
        });
        categoriesCopied++;
        targetCatId = newCat.id;
      }

      if (!copyProducts) continue;

      for (const srcProd of srcCat.products) {
        const existingProd = await prisma.product.findFirst({
          where: { categoryId: targetCatId, name: srcProd.name },
        });

        if (existingProd) {
          if (!overwrite) { productsSkipped++; continue; }
          await prisma.product.update({
            where: { id: existingProd.id },
            data: {
              nameAz: srcProd.nameAz, nameEn: srcProd.nameEn, nameRu: srcProd.nameRu, nameTr: srcProd.nameTr,
              descriptionAz: srcProd.descriptionAz, descriptionEn: srcProd.descriptionEn,
              price: srcProd.price, image: srcProd.image, sortOrder: srcProd.sortOrder,
              calories: srcProd.calories, allergens: srcProd.allergens, prepTime: srcProd.prepTime,
            },
          });
          productsCopied++;
        } else {
          await prisma.product.create({
            data: {
              categoryId: targetCatId,
              name: srcProd.name, nameAz: srcProd.nameAz, nameEn: srcProd.nameEn,
              nameRu: srcProd.nameRu, nameTr: srcProd.nameTr,
              descriptionAz: srcProd.descriptionAz, descriptionEn: srcProd.descriptionEn,
              descriptionRu: srcProd.descriptionRu, descriptionTr: srcProd.descriptionTr,
              price: srcProd.price, image: srcProd.image, sortOrder: srcProd.sortOrder,
              calories: srcProd.calories, allergens: srcProd.allergens, prepTime: srcProd.prepTime,
            },
          });
          productsCopied++;
        }
      }
    }

    res.json({
      success: true,
      data: { categoriesCopied, categoriesSkipped, productsCopied, productsSkipped },
      message: `${categoriesCopied} kateqoriya, ${productsCopied} məhsul kopyalandı`,
    });
  } catch (err) { next(err); }
});

export { router as menuRoutes };
