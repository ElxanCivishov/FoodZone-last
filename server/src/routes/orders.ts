import { Router } from "express";
import { prisma } from "../lib/prisma";
import { createOrderSchema, updateOrderStatusSchema } from "../lib/validation";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "preparing", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "preparing", "cancelled"],
  served: [],
  cancelled: ["pending"],
};

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "cancelled",
];

router.get(
  "/",
  authenticate,
  authorize(["admin", "manager", "kitchen", "waiter"]),
  async (req, res, next) => {
    try {
      const { status, limit = "50", offset = "0" } = req.query;
      const where: any = {};
      if (status) {
        if (!VALID_ORDER_STATUSES.includes(status as string)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid status value" });
        }
        where.status = status;
      }
      const orders = await prisma.order.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: { table: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  },
);

router.get("/table/:tableId", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tableId: req.params.tableId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        table: true,
        items: { include: { product: true, extras: true } },
      },
    });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createOrderSchema), async (req, res, next) => {
  try {
    const {
      tableId,
      branchId,
      items,
      paymentMethod,
      specialRequest,
      discountCode,
    } = req.body;

    const table = await prisma.table.findFirst({
      where: { id: tableId, branchId },
    });
    if (!table)
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });

    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = await Promise.all(
        items.map(async (item: any) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { sizes: true, extras: true },
          });
          if (!product)
            throw Object.assign(
              new Error(`Product not found: ${item.productId}`),
              { status: 400 },
            );

          let unitPrice = product.price;
          if (item.selectedSizeId) {
            const size = product.sizes.find(
              (s: any) => s.id === item.selectedSizeId,
            );
            if (size) unitPrice += size.priceModifier;
          }

          const extraItems: { extraId: string; name: string; price: number }[] =
            [];
          if (item.selectedExtras?.length) {
            for (const extraId of item.selectedExtras) {
              const extra = product.extras.find((e: any) => e.id === extraId);
              if (!extra)
                throw Object.assign(new Error(`Extra not found: ${extraId}`), {
                  status: 400,
                });
              extraItems.push({
                extraId,
                name: extra.name,
                price: extra.price,
              });
            }
          }

          const extrasTotal = extraItems.reduce((s, e) => s + e.price, 0);
          const totalPrice = (unitPrice + extrasTotal) * item.quantity;

          return {
            productId: item.productId,
            quantity: item.quantity,
            selectedSizeId: item.selectedSizeId,
            unitPrice,
            totalPrice,
            specialNote: item.specialNote,
            extras: { create: extraItems },
          };
        }),
      );

      const subtotal = orderItemsData.reduce(
        (sum, it) => sum + it.totalPrice,
        0,
      );
      const serviceFee = subtotal * 0.05;
      const total = subtotal + serviceFee;
      const orderNumber = `FZ-${Date.now().toString(36).toUpperCase()}`;

      return tx.order.create({
        data: {
          orderNumber,
          tableId,
          branchId,
          subtotal,
          serviceFee,
          total,
          status: "pending",
          paymentMethod,
          specialRequest,
          discountCode,
          items: { create: orderItemsData },
        },
        include: { items: { include: { product: true } }, table: true },
      });
    });

    const io = (req as any).io;
    io.to("kitchen").emit("kitchen:new:order", order);
    io.to("admin").emit("kitchen:new:order", order);
    io.to(`table:${tableId}`).emit("customer:order:update", {
      orderId: order.id,
      status: "confirmed",
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id/status",
  authenticate,
  authorize(["admin", "manager", "kitchen", "waiter"]),
  validate(updateOrderStatusSchema),
  async (req, res, next) => {
    try {
      const { status, estimatedTime } = req.body;

      const existing = await prisma.order.findUnique({
        where: { id: req.params.id },
        select: { status: true, tableId: true },
      });
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });

      const allowed = ORDER_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition order from '${existing.status}' to '${status}'`,
        });
      }

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status, ...(estimatedTime !== undefined && { estimatedTime }) },
        include: { table: true, items: { include: { product: true } } },
      });

      const io = (req as any).io;
      io.to("kitchen").emit("order:status:changed", {
        orderId: order.id,
        status,
        tableId: order.tableId,
        order,
      });
      io.to("admin").emit("order:status:changed", {
        orderId: order.id,
        status,
        tableId: order.tableId,
        order,
      });
      io.to(`table:${order.tableId}`).emit("customer:order:update", {
        orderId: order.id,
        status,
      });
      if (status === "ready") {
        io.to("waiters").emit("waiter:new:order", order);
        io.to(`table:${order.tableId}`).emit("customer:order:ready", {
          orderId: order.id,
          status: "ready",
        });
      }
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },
);

export { router as orderRoutes };
