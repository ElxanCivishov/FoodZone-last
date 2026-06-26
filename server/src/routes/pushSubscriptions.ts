import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { endpoint, p256dh, auth, branchId } = req.body;
    const userId = (req as any).user?.id;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ success: false, message: 'Subscription data required' });
    }

    // Upsert by endpoint to avoid duplicates
    await prisma.pushSubscription.upsert({
      where: { id: endpoint }, // use a virtual id approach via create/update
      create: { endpoint, p256dh, auth, userId, branchId },
      update: { p256dh, auth, userId, branchId },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// Unsubscribe
router.post('/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Get VAPID public key
router.get('/vapid-key', (_req, res) => {
  res.json({ success: true, data: process.env.VAPID_PUBLIC_KEY ?? null });
});

export { router as pushSubscriptionRoutes };
