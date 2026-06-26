import webpush from 'web-push';
import { prisma } from './prisma';

// Initialise only if VAPID keys are configured
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@foodzone.az',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.allSettled(
    subs.map(sub =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        .catch(() =>
          // Delete expired/invalid subscriptions automatically
          prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null),
        ),
    ),
  );
}

export async function sendPushToBranch(branchId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const subs = await prisma.pushSubscription.findMany({ where: { branchId } });

  await Promise.allSettled(
    subs.map(sub =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        .catch(() =>
          prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null),
        ),
    ),
  );
}
