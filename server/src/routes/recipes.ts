import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Məhsulun reseptini al
router.get('/product/:productId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { productId: req.params.productId },
      include: { ingredients: { include: { rawMaterial: true } } },
    });
    res.json({ success: true, data: recipe });
  } catch (err) { next(err); }
});

// Resept yarat / yenilə (upsert)
router.put('/product/:productId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { yield: yieldAmount = 1, note, ingredients = [] } = req.body;

    const recipe = await prisma.recipe.upsert({
      where: { productId: req.params.productId },
      update: { yield: yieldAmount, note },
      create: { productId: req.params.productId, yield: yieldAmount, note },
    });

    await prisma.ingredient.deleteMany({ where: { recipeId: recipe.id } });

    if (ingredients.length) {
      await prisma.ingredient.createMany({
        data: ingredients.map((ing: any) => ({
          recipeId: recipe.id,
          rawMaterialId: ing.rawMaterialId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      });
    }

    const updated = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { ingredients: { include: { rawMaterial: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// Resepti sil
router.delete('/product/:productId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { productId: req.params.productId } });
    if (!recipe) return res.status(404).json({ success: false, message: 'Resept tapılmadı' });
    await prisma.recipe.delete({ where: { id: recipe.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export { router as recipeRoutes };
