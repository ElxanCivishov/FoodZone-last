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
      const { defaultPrepTime } = req.body;
      if (
        defaultPrepTime !== undefined &&
        (typeof defaultPrepTime !== "number" ||
          defaultPrepTime < 1 ||
          defaultPrepTime > 120)
      ) {
        return res.status(400).json({
          success: false,
          message: "defaultPrepTime must be between 1 and 120 minutes",
        });
      }
      const settings = await prisma.settings.upsert({
        where: { id: SINGLETON_ID },
        update: { ...(defaultPrepTime !== undefined && { defaultPrepTime }) },
        create: { id: SINGLETON_ID, defaultPrepTime: defaultPrepTime ?? 15 },
      });
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },
);

export { router as settingsRoutes };
