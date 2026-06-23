import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Stok aktivləşdirilmiş bütün məhsullar + az qalanlar
router.get('/products', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, filter } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const products = await prisma.product.findMany({
      where: {
        category: { branchId: branchId as string },
        stockEnabled: true,
      },
      include: {
        category: { select: { id: true, name: true, nameAz: true } },
      },
      orderBy: { nameAz: 'asc' },
    });

    const withStatus = products.map(p => ({
      ...p,
      stockStatus:
        p.stockQuantity === 0 ? 'out' :
        p.stockQuantity !== null && p.lowStockThreshold !== null && p.stockQuantity <= p.lowStockThreshold ? 'low' :
        'ok',
    }));

    const filtered = filter === 'low'
      ? withStatus.filter(p => p.stockStatus === 'low' || p.stockStatus === 'out')
      : withStatus;

    res.json({ success: true, data: filtered });
  } catch (err) { next(err); }
});

// Stok hərəkətləri tarixi
router.get('/movements', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, productId, type, page = '1', limit = '50' } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const where: any = { branchId };
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, nameAz: true, unit: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({ success: true, data: movements, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// Stok yenilə (alış, düzəliş, israf)
router.post('/adjust', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { productId, branchId, type, quantity, unitCost, note } = req.body;
    const userId = (req as any).user?.id;

    if (!productId || !branchId || !type || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'productId, branchId, type, quantity tələb olunur' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Məhsul tapılmadı' });

    // Miqdarı hesabla
    let newQuantity = product.stockQuantity ?? 0;
    if (type === 'purchase' || type === 'return' || type === 'adjustment') {
      newQuantity = newQuantity + Number(quantity);
    } else if (type === 'waste') {
      newQuantity = Math.max(0, newQuantity - Number(quantity));
    }

    const [movement, updatedProduct] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId,
          branchId,
          type,
          quantity: Number(quantity),
          unitCost,
          note,
          createdById: userId,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          stockEnabled: true,
          stockQuantity: newQuantity,
          status: newQuantity === 0 ? 'out_of_stock' : (product.status === 'out_of_stock' ? 'active' : product.status),
        },
      }),
    ]);

    // Az qalıb bildirişi
    if (
      updatedProduct.stockEnabled &&
      updatedProduct.stockQuantity !== null &&
      updatedProduct.lowStockThreshold !== null &&
      updatedProduct.stockQuantity <= updatedProduct.lowStockThreshold
    ) {
      await prisma.notification.create({
        data: {
          branchId,
          type: 'low_stock',
          title: 'Stok azalır',
          message: `"${updatedProduct.nameAz}" məhsulundan yalnız ${updatedProduct.stockQuantity} ${updatedProduct.unit ?? 'ədəd'} qalıb`,
          data: { productId, stockQuantity: updatedProduct.stockQuantity },
        },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: `stock.${type}`,
        entityType: 'Product',
        entityId: productId,
        oldValues: { stockQuantity: product.stockQuantity },
        newValues: { stockQuantity: newQuantity, type, quantity },
      },
    }).catch(() => {});

    res.json({ success: true, data: { movement, product: updatedProduct } });
  } catch (err) { next(err); }
});

// Toplu stok yeniləmə
router.post('/bulk-adjust', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId, items } = req.body;
    const userId = (req as any).user?.id;

    if (!branchId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'branchId və items[] tələb olunur' });
    }

    const results = await Promise.all(
      items.map(async ({ productId, type, quantity, unitCost, note }: any) => {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return null;

        let newQty = product.stockQuantity ?? 0;
        if (type === 'purchase' || type === 'return') newQty += Number(quantity);
        else if (type === 'waste') newQty = Math.max(0, newQty - Number(quantity));
        else if (type === 'adjustment') newQty = Number(quantity);

        await prisma.$transaction([
          prisma.stockMovement.create({
            data: { productId, branchId, type, quantity: Number(quantity), unitCost, note, createdById: userId },
          }),
          prisma.product.update({
            where: { id: productId },
            data: {
              stockEnabled: true,
              stockQuantity: newQty,
              status: newQty === 0 ? 'out_of_stock' : (product.status === 'out_of_stock' ? 'active' : product.status),
            },
          }),
        ]);

        return { productId, newQuantity: newQty };
      })
    );

    res.json({ success: true, data: results.filter(Boolean) });
  } catch (err) { next(err); }
});

// Məhsulda stok aktiv/deaktiv et
router.patch('/products/:productId/toggle', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { stockEnabled, stockQuantity, lowStockThreshold, unit } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.productId },
      data: {
        ...(stockEnabled !== undefined && { stockEnabled }),
        ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(unit !== undefined && { unit }),
      },
    });

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// Stok xülasəsi (az qalanlar, bitənlər sayı)
router.get('/summary', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    if (!branchId) return res.status(400).json({ success: false, message: 'branchId tələb olunur' });

    const products = await prisma.product.findMany({
      where: { category: { branchId: branchId as string }, stockEnabled: true },
      select: { stockQuantity: true, lowStockThreshold: true },
    });

    const total = products.length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;
    const lowStock = products.filter(
      p => p.stockQuantity !== null && p.lowStockThreshold !== null &&
           p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
    ).length;
    const healthy = total - outOfStock - lowStock;

    res.json({ success: true, data: { total, outOfStock, lowStock, healthy } });
  } catch (err) { next(err); }
});

export { router as inventoryRoutes };
