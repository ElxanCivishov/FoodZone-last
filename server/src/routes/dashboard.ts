import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get(
  "/stats",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        activeTables,
        totalTables,
        pendingOrders,
        readyOrders,
        popularProducts,
        recentOrders,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { total: true } }),
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { total: true },
        }),
        prisma.table.count({ where: { status: "active" } }),
        prisma.table.count(),
        prisma.order.count({ where: { status: "pending" } }),
        prisma.order.count({ where: { status: "ready" } }),
        prisma.product.findMany({
          where: { isPopular: true, status: "active" },
          take: 5,
          include: { category: { select: { name: true } } },
        }),
        prisma.order.findMany({
          where: { createdAt: { gte: today } },
          include: {
            items: { include: { product: { select: { name: true } } } },
            table: { select: { number: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      // Calculate average order time for today
      const servedOrders = await prisma.order.findMany({
        where: { status: "served", createdAt: { gte: today } },
        select: { createdAt: true, updatedAt: true },
      });

      let avgOrderTime = 0;
      if (servedOrders.length > 0) {
        const totalMinutes = servedOrders.reduce((sum, o) => {
          return (
            sum +
            (new Date(o.updatedAt).getTime() -
              new Date(o.createdAt).getTime()) /
              60000
          );
        }, 0);
        avgOrderTime = Math.round(totalMinutes / servedOrders.length);
      }

      res.json({
        success: true,
        data: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          todayOrders,
          todayRevenue: todayRevenue._sum.total || 0,
          activeTables,
          totalTables,
          pendingOrders,
          readyOrders,
          avgOrderTime,
          popularProducts,
          recentOrders,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/orders-by-status",
  authenticate,
  authorize(["admin", "manager", "kitchen", "waiter"]),
  async (req, res, next) => {
    try {
      const statuses = [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "cancelled",
      ];
      const counts = await Promise.all(
        statuses.map((status) => prisma.order.count({ where: { status } })),
      );
      const data = statuses.map((status, i) => ({ status, count: counts[i] }));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

export { router as dashboardRoutes };
