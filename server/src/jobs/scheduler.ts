import cron from 'node-cron';
import type { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { notify } from '../lib/notify';

const SLA_THRESHOLD_MINUTES = 20;

// Track which orders we've already notified to avoid spamming
const notifiedSlaOrders = new Set<string>();

export function startScheduler(io: Server) {
  // SLA breach — every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      const threshold = new Date(Date.now() - SLA_THRESHOLD_MINUTES * 60_000);

      const overdueOrders = await prisma.order.findMany({
        where: {
          status: { in: ['pending', 'preparing'] },
          createdAt: { lt: threshold },
        },
        select: {
          id: true,
          orderNumber: true,
          branchId: true,
          status: true,
          createdAt: true,
          estimatedTime: true,
        },
      });

      for (const order of overdueOrders) {
        if (notifiedSlaOrders.has(order.id)) continue;

        const waitMinutes = Math.round((Date.now() - order.createdAt.getTime()) / 60_000);
        const threshold = order.estimatedTime ?? SLA_THRESHOLD_MINUTES;

        if (waitMinutes < threshold) continue;

        notifiedSlaOrders.add(order.id);

        await notify({
          io,
          branchId: order.branchId,
          type: 'sla_breach',
          title: 'Sifariş gecikir',
          message: `#${order.orderNumber} — ${waitMinutes} dəqiqədir "${order.status}" vəziyyətindədir`,
          data: { orderId: order.id, waitMinutes },
        }).catch(() => {});
      }

      // Clean up resolved orders from notified set
      if (notifiedSlaOrders.size > 500) {
        notifiedSlaOrders.clear();
      }
    } catch {
      // silent
    }
  });

  // Günlük hesabat — hər gün 23:50
  cron.schedule('50 23 * * *', async () => {
    try {
      const branches = await prisma.branch.findMany({ where: { status: 'active' }, select: { id: true, name: true } });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const branch of branches) {
        const stats = await prisma.order.aggregate({
          where: { branchId: branch.id, createdAt: { gte: today }, status: { not: 'cancelled' } },
          _sum: { total: true }, _count: { id: true },
        });
        const revenue = (stats._sum.total ?? 0).toFixed(2);
        const count = stats._count.id;

        await notify({
          io,
          branchId: branch.id,
          type: 'daily_report',
          title: `Günlük hesabat — ${branch.name}`,
          message: `${count} sifariş · ${revenue} ₼ gəlir`,
          data: { orders: count, revenue },
        }).catch(() => {});
      }
    } catch { /* silent */ }
  });

  console.log('⏰ Scheduler started (SLA: 2 min, Daily report: 23:50)');
}
