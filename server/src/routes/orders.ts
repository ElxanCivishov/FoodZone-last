import { Router } from "express";
import { prisma } from "../lib/prisma";
import { notify } from "../lib/notify";
import { createOrderSchema, updateOrderStatusSchema } from "../lib/validation";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

async function deductStockForOrder(orderId: string, branchId: string, orderNumber: string, io: any) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { recipe: { include: { ingredients: true } } },
          },
        },
      },
    },
  });
  if (!order) return;

  for (const item of order.items) {
    const product = item.product;

    // 1. Məhsulun öz stoku
    if (product.stockEnabled && product.stockQuantity !== null) {
      const newQty = Math.max(0, product.stockQuantity - item.quantity);
      await prisma.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: newQty,
          status: newQty === 0 ? 'out_of_stock' : (product.status === 'out_of_stock' ? 'active' : product.status),
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          branchId,
          type: 'sale',
          quantity: item.quantity,
          note: `Sifariş #${orderNumber} (confirmed)`,
        },
      });
    }

    // 2. Resept varsa xammalları azalt
    if (product.recipe) {
      for (const ing of product.recipe.ingredients) {
        const consumeQty = (ing.quantity * item.quantity) / product.recipe.yield;
        const updated = await prisma.rawMaterial.update({
          where: { id: ing.rawMaterialId },
          data: { currentStock: { decrement: consumeQty } },
        });
        await prisma.rawMovement.create({
          data: {
            rawMaterialId: ing.rawMaterialId,
            branchId,
            type: 'consumption',
            quantity: -consumeQty,
            orderId,
            note: `Sifariş #${orderNumber}`,
          },
        });

        if (updated.currentStock <= updated.minStock) {
          const { notify } = await import('../lib/notify');
          await notify({
            io,
            branchId,
            type: 'low_stock',
            title: 'Xammal azalır',
            message: `${updated.nameAz}: ${updated.currentStock.toFixed(2)} ${updated.unit}`,
            data: { rawMaterialId: updated.id },
          }).catch(() => {});
        }
      }
    }
  }
}

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "preparing", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "preparing", "cancelled"],
  served: [],
  cancelled: ["pending"],
};

const VALID_ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "served", "cancelled"];
const VALID_FULFILLMENT_TYPES = ["delivery", "takeaway", "dine_in"];

const orderInclude = {
  table: true,
  cancelledBy: { select: { id: true, name: true, email: true, role: true } },
  paidBy: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, phone: true, points: true } },
  promoCode: { select: { id: true, code: true, type: true, value: true } },
  items: { include: { product: true, extras: true } },
};

router.get("/", authenticate, authorize(["admin", "manager", "kitchen", "waiter"]), async (req, res, next) => {
  try {
    const { status, fulfillmentType, limit = "50", offset = "0", branchId } = req.query;
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) {
      if (!VALID_ORDER_STATUSES.includes(status as string))
        return res.status(400).json({ success: false, message: "Invalid status value" });
      where.status = status;
    }
    if (fulfillmentType) {
      if (!VALID_FULFILLMENT_TYPES.includes(fulfillmentType as string))
        return res.status(400).json({ success: false, message: "Invalid fulfillment type" });
      where.fulfillmentType = fulfillmentType;
    }
    const orders = await prisma.order.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

router.get("/table/:tableId", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tableId: req.params.tableId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

router.post("/", validate(createOrderSchema), async (req, res, next) => {
  try {
    const {
      tableId, branchId, fulfillmentType = "dine_in",
      customerName, customerPhone, deliveryAddress, deliveryNote, pickupTime,
      items, paymentMethod, specialRequest, discountCode,
      promoCode: promoCodeStr, customerId, cashDrawerId,
      redeemPoints = 0,
    } = req.body;

    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true } });
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });

    const isDineIn = fulfillmentType === "dine_in";
    const resolvedTableId = isDineIn ? tableId : null;

    if (isDineIn && tableId) {
      const table = await prisma.table.findFirst({ where: { id: tableId, branchId } });
      if (!table) return res.status(404).json({ success: false, message: "Table not found" });
    }

    // Promo kod yoxla
    let promoCodeRecord: any = null;
    let promoDiscount = 0;
    if (promoCodeStr) {
      promoCodeRecord = await prisma.promoCode.findUnique({
        where: { branchId_code: { branchId, code: promoCodeStr.toUpperCase() } },
      });
      if (promoCodeRecord && promoCodeRecord.status === 'active') {
        const now = new Date();
        const isValid = promoCodeRecord.validFrom <= now && promoCodeRecord.validTo >= now &&
          (promoCodeRecord.maxUses === null || promoCodeRecord.usedCount < promoCodeRecord.maxUses);
        if (!isValid) promoCodeRecord = null;
      } else {
        promoCodeRecord = null;
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = await Promise.all(
        items.map(async (item: any) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { sizes: true, extras: true },
          });
          if (!product) throw Object.assign(new Error(`Product not found: ${item.productId}`), { status: 400 });

          // Stok yoxla
          if (product.stockEnabled && product.stockQuantity !== null) {
            if (product.stockQuantity < item.quantity) {
              throw Object.assign(
                new Error(`"${product.nameAz}" məhsulundan yalnız ${product.stockQuantity} ədəd qalıb`),
                { status: 400 }
              );
            }
          }

          let unitPrice = product.price;
          if (item.selectedSizeId) {
            const size = product.sizes.find((s: any) => s.id === item.selectedSizeId);
            if (size) unitPrice += size.priceModifier;
          }

          const extraItems: { extraId: string; name: string; price: number }[] = [];
          if (item.selectedExtras?.length) {
            for (const extraId of item.selectedExtras) {
              const extra = product.extras.find((e: any) => e.id === extraId);
              if (!extra) throw Object.assign(new Error(`Extra not found: ${extraId}`), { status: 400 });
              extraItems.push({ extraId, name: extra.name, price: extra.price });
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
        })
      );

      const subtotal = orderItemsData.reduce((sum, it) => sum + it.totalPrice, 0);
      const serviceFee = subtotal * 0.05;

      if (promoCodeRecord) {
        promoDiscount = promoCodeRecord.type === 'percent'
          ? (subtotal * promoCodeRecord.value) / 100
          : promoCodeRecord.value;
        promoDiscount = Math.min(promoDiscount, subtotal);
      }

      // Loyalty points redemption: 100 points = 1 AZN
      let pointsDiscount = 0;
      if (redeemPoints > 0 && customerId) {
        const cust = await tx.customer.findUnique({ where: { id: customerId }, select: { points: true } });
        if (cust && cust.points >= redeemPoints) {
          pointsDiscount = redeemPoints * 0.01;
          await tx.customer.update({ where: { id: customerId }, data: { points: { decrement: redeemPoints } } });
        }
      }

      const total = Math.max(0, subtotal + serviceFee - promoDiscount - pointsDiscount);
      const orderNumber = `FZ-${Date.now().toString(36).toUpperCase()}`;
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

      const created = await tx.order.create({
        data: {
          orderNumber,
          receiptNumber,
          tableId: resolvedTableId,
          branchId,
          fulfillmentType,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          deliveryAddress: deliveryAddress || null,
          deliveryNote: deliveryNote || null,
          pickupTime: pickupTime ? new Date(pickupTime) : null,
          customerId: customerId || null,
          cashDrawerId: cashDrawerId || null,
          promoCodeId: promoCodeRecord?.id || null,
          promoDiscount,
          subtotal,
          serviceFee,
          total,
          status: "pending",
          paymentMethod,
          specialRequest,
          discountCode,
          items: { create: orderItemsData },
        },
        include: orderInclude,
      });

      // Promo kod kullanım sayını artır
      if (promoCodeRecord) {
        await tx.promoCode.update({
          where: { id: promoCodeRecord.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    const io = (req as any).io;
    io.to("kitchen").emit("kitchen:new:order", order);
    io.to("admin").emit("kitchen:new:order", order);
    if (order.tableId) {
      io.to(`table:${order.tableId}`).emit("customer:order:update", { orderId: order.id, status: order.status });
    }
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

// Ödəniş qəbul et
router.post("/:id/pay", authenticate, authorize(["admin", "manager", "waiter"]), async (req, res, next) => {
  try {
    const { paymentMethod, tip, cashDrawerId } = req.body;
    const userId = (req as any).user?.id;

    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, customer: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: "Sifariş tapılmadı" });
    if (existing.paymentStatus === 'paid') return res.status(400).json({ success: false, message: "Sifariş artıq ödənilib" });

    const payIo = (req as any).io;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || existing.paymentMethod,
        paidAt: new Date(),
        paidById: userId,
        tip: tip ? Number(tip) : 0,
        ...(cashDrawerId && { cashDrawerId }),
      },
      include: orderInclude,
    });

    // Stok azalt (ödəniş anında)
    for (const item of existing.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product?.stockEnabled && product.stockQuantity !== null) {
        const newQty = Math.max(0, product.stockQuantity - item.quantity);
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: newQty,
            status: newQty === 0 ? 'out_of_stock' : (product.status === 'out_of_stock' ? 'active' : product.status),
          },
        });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            branchId: existing.branchId,
            type: 'sale',
            quantity: item.quantity,
            note: `Sifariş #${existing.orderNumber}`,
            createdById: userId,
          },
        });

        // Az qalıb bildirişi
        const updated = await prisma.product.findUnique({ where: { id: item.productId } });
        if (updated?.stockEnabled && updated.stockQuantity !== null && updated.lowStockThreshold !== null
          && updated.stockQuantity <= updated.lowStockThreshold) {
          notify({
            io: payIo,
            branchId: existing.branchId,
            type: 'low_stock',
            title: 'Stok azalır',
            message: `"${updated.nameAz}" — yalnız ${updated.stockQuantity} ${updated.unit ?? 'ədəd'} qalıb`,
            data: { productId: item.productId },
          }).catch(() => {});
        }
      }
    }

    // Müştəri statistikasını yenilə
    if (existing.customerId) {
      await prisma.customer.update({
        where: { id: existing.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: existing.total },
          points: { increment: Math.floor(existing.total) },
          lastVisit: new Date(),
        },
      }).catch(() => {});
    }

    const io = (req as any).io;

    // Ödəniş bildirişi
    notify({
      io,
      branchId: existing.branchId,
      type: 'payment_received',
      title: 'Ödəniş qəbul edildi',
      message: `#${existing.orderNumber} — ${order.total.toFixed(2)} ₼ (${paymentMethod || existing.paymentMethod})`,
      data: { orderId: existing.id },
    }).catch(() => {});

    io.to("admin").emit("order:paid", { orderId: order.id, order });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

router.patch(
  "/:id/status",
  authenticate,
  authorize(["admin", "manager", "kitchen", "waiter"]),
  validate(updateOrderStatusSchema),
  async (req, res, next) => {
    try {
      const { status, estimatedTime, cancelReason } = req.body;
      const cancelledById = req.user?.id ?? req.user?.userId;

      const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
      if (!existing) return res.status(404).json({ success: false, message: "Order not found" });

      const allowed = ORDER_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition order from '${existing.status}' to '${status}'`,
        });
      }

      let statusData: Record<string, unknown> = {};

      if (status === "confirmed") {
        deductStockForOrder(existing.id, existing.branchId, existing.orderNumber, (req as any).io).catch(() => {});
      } else if (status === "preparing") {
        statusData = {
          preparationStartedAt: new Date(),
          preparationCompletedAt: null,
          preparationDuration: null,
          delayMinutes: null,
        };
      } else if (status === "ready" && existing.preparationStartedAt) {
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - existing.preparationStartedAt.getTime();
        const durationMinutes = Math.round(durationMs / 60_000);
        const estimated = estimatedTime !== undefined ? estimatedTime : (existing.estimatedTime ?? 15);
        statusData = {
          preparationCompletedAt: completedAt,
          preparationDuration: durationMinutes,
          delayMinutes: durationMinutes - estimated,
        };
      } else if (status === "cancelled") {
        let resolvedCancelledById: string | null = null;
        if (cancelledById) {
          const canceller = await prisma.user.findUnique({ where: { id: cancelledById }, select: { id: true } });
          resolvedCancelledById = canceller?.id ?? null;
        }
        statusData = {
          cancelReason: cancelReason?.trim() || null,
          cancelledAt: new Date(),
          ...(resolvedCancelledById && { cancelledById: resolvedCancelledById }),
        };
      } else if (status === "pending") {
        statusData = {
          cancelReason: null, cancelledAt: null, cancelledById: null,
          preparationStartedAt: null, preparationCompletedAt: null,
          preparationDuration: null, delayMinutes: null,
        };
      }

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status, ...(estimatedTime !== undefined && { estimatedTime }), ...statusData },
        include: orderInclude,
      });

      const io = (req as any).io;

      // Ləğv bildirişi
      if (status === 'cancelled') {
        notify({
          io,
          branchId: existing.branchId,
          type: 'order_cancelled',
          title: 'Sifariş ləğv edildi',
          message: `#${existing.orderNumber}${existing.cancelReason ? ` — ${cancelReason}` : ''}`,
          data: { orderId: existing.id },
        }).catch(() => {});
      }

      io.to("kitchen").emit("order:status:changed", { orderId: order.id, status, tableId: order.tableId, order });
      io.to("admin").emit("order:status:changed", { orderId: order.id, status, tableId: order.tableId, order });
      if (order.tableId) {
        io.to(`table:${order.tableId}`).emit("customer:order:update", { orderId: order.id, status });
      }
      if (status === "ready") {
        const fulfillmentType = order.fulfillmentType ?? "dine_in";
        if (fulfillmentType === "dine_in" && order.tableId) {
          io.to("waiters").emit("waiter:new:order", order);
          io.to(`table:${order.tableId}`).emit("customer:order:ready", { orderId: order.id, status: "ready" });
        }
      }
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  }
);

// Item-level status — KDS item tick
router.patch(
  '/:orderId/items/:itemId/status',
  authenticate,
  authorize(['admin', 'manager', 'kitchen']),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!['pending', 'preparing', 'ready'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid item status' });
      }

      const item = await prisma.orderItem.update({
        where: { id: req.params.itemId },
        data: { status },
      });

      // If all items are ready, auto-promote order to ready
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: req.params.orderId },
      });
      if (allItems.every(i => i.status === 'ready')) {
        const order = await prisma.order.update({
          where: { id: req.params.orderId },
          data: { status: 'ready' },
          include: orderInclude,
        });
        const io = (req as any).io;
        io.to('kitchen').emit('order:status:changed', { orderId: order.id, status: 'ready', order });
        io.to('admin').emit('order:status:changed', { orderId: order.id, status: 'ready', order });
      }

      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
);

export { router as orderRoutes };
