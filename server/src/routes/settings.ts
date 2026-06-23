import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

const SINGLETON_ID = "singleton";

async function getOrCreate() {
  return prisma.settings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, defaultPrepTime: 15 },
  });
}

router.get("/", authenticate, async (_req, res, next) => {
  try {
    const settings = await getOrCreate();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res, next) => {
    try {
      const { defaultPrepTime, urgencyWarnMin, urgencyDangerMin, kitchenAutoPrint, kitchenSoundOn, waiterSoundOn } = req.body;

      if (defaultPrepTime !== undefined && (typeof defaultPrepTime !== "number" || defaultPrepTime < 1 || defaultPrepTime > 120))
        return res.status(400).json({ success: false, message: "defaultPrepTime must be 1–120" });
      if (urgencyWarnMin !== undefined && (typeof urgencyWarnMin !== "number" || urgencyWarnMin < 1 || urgencyWarnMin > 60))
        return res.status(400).json({ success: false, message: "urgencyWarnMin must be 1–60" });
      if (urgencyDangerMin !== undefined && (typeof urgencyDangerMin !== "number" || urgencyDangerMin < 1 || urgencyDangerMin > 60))
        return res.status(400).json({ success: false, message: "urgencyDangerMin must be 1–60" });

      const update: Record<string, any> = {};
      if (defaultPrepTime !== undefined) update.defaultPrepTime = defaultPrepTime;
      if (urgencyWarnMin !== undefined) update.urgencyWarnMin = urgencyWarnMin;
      if (urgencyDangerMin !== undefined) update.urgencyDangerMin = urgencyDangerMin;
      if (kitchenAutoPrint !== undefined) update.kitchenAutoPrint = kitchenAutoPrint;
      if (kitchenSoundOn !== undefined) update.kitchenSoundOn = kitchenSoundOn;
      if (waiterSoundOn !== undefined) update.waiterSoundOn = waiterSoundOn;

      const settings = await prisma.settings.upsert({
        where: { id: SINGLETON_ID },
        update,
        create: { id: SINGLETON_ID, defaultPrepTime: 15, urgencyWarnMin: 4, urgencyDangerMin: 8, kitchenAutoPrint: false, kitchenSoundOn: true, waiterSoundOn: true, ...update },
      });
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Filial üzrə ayrı settings (BranchSettings) ─────────────────────────────

router.get('/branch/:branchId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const [global, branch] = await Promise.all([
      getOrCreate(),
      (prisma as any).branchSettings.findUnique({ where: { branchId } }),
    ]);
    // Merge: branch-specific values override global
    const merged = {
      ...global,
      ...(branch ?? {}),
      branchId,
      isCustomized: !!branch,
    };
    res.json({ success: true, data: merged });
  } catch (err) { next(err); }
});

router.patch('/branch/:branchId', authenticate, authorize(['admin', 'manager']), async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const allowed = ['defaultPrepTime', 'urgencyWarnMin', 'urgencyDangerMin', 'kitchenAutoPrint',
      'kitchenSoundOn', 'waiterSoundOn', 'serviceFeePercent', 'currency', 'timezone', 'taxPercent', 'receiptFooter'];
    const data: Record<string, any> = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const result = await (prisma as any).branchSettings.upsert({
      where: { branchId },
      update: data,
      create: { branchId, ...data },
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.delete('/branch/:branchId/reset', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    await (prisma as any).branchSettings.deleteMany({ where: { branchId: req.params.branchId } });
    res.json({ success: true, message: 'Filial ayarları sıfırlandı, qlobal ayarlara qayıdıldı' });
  } catch (err) { next(err); }
});

export { router as settingsRoutes };
