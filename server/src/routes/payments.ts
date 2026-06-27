import { Router } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { notify } from "../lib/notify";
import { authenticate, authorize } from "../middleware/auth";
import {
  createPayriffPayment,
  getPayriffStatus,
  refundPayriff,
} from "../lib/payriff";
import { createM10Payment, getM10Status, verifyM10Webhook } from "../lib/m10";

const router = Router();

// ── List payments (admin) ─────────────────────────────────────────────────────
router.get(
  "/",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res, next) => {
    try {
      const { branchId, status, limit = 50, offset = 0 } = req.query;
      const where: any = {};
      if (branchId) where.order = { branchId };
      if (status) where.status = status;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            order: {
              select: { orderNumber: true, branchId: true, total: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: Number(limit),
          skip: Number(offset),
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({ success: true, data: { payments, total } });
    } catch (err) {
      next(err);
    }
  },
);

// ── Payriff: create ───────────────────────────────────────────────────────────
router.post("/payriff/create", async (req, res, next) => {
  try {
    const { orderId, lang } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Sifariş tapılmadı" });

    const result = await createPayriffPayment({
      orderId,
      amount: order.total,
      description: `FoodZone Sifariş #${order.orderNumber}`,
      lang,
    });

    await prisma.payment.create({
      data: {
        orderId,
        method: "payriff",
        provider: "payriff",
        amount: order.total,
        status: "pending",
        externalRef: result.paymentId,
        paymentUrl: result.paymentUrl,
      },
    });

    res.json({
      success: true,
      data: { paymentUrl: result.paymentUrl, paymentId: result.paymentId },
    });
  } catch (err) {
    next(err);
  }
});

// ── Payriff: webhook ──────────────────────────────────────────────────────────
router.post("/payriff/webhook", async (req, res, next) => {
  try {
    const sig = req.headers["x-payriff-signature"] as string;
    const body = JSON.stringify(req.body);
    const expected = crypto
      .createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET ?? "")
      .update(body)
      .digest("hex");

    if (sig !== expected)
      return res
        .status(401)
        .json({ success: false, message: "Invalid signature" });

    const { paymentId, status } = req.body;
    const payment = await prisma.payment.findFirst({
      where: { externalRef: paymentId },
    });
    if (!payment) return res.status(404).json({ success: false });

    const paymentStatus =
      status === "APPROVED"
        ? "success"
        : status === "DECLINED"
          ? "failed"
          : "pending";

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: paymentStatus, webhookData: req.body },
    });

    if (paymentStatus === "success") {
      const order = await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "paid", paidAt: new Date() },
      });

      await notify({
        io: (req as any).io,
        branchId: order.branchId,
        type: "payment_received",
        title: "Ödəniş alındı",
        message: `#${order.orderNumber} — ${order.total.toFixed(2)} ₼ (Payriff)`,
        data: { orderId: order.id },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Payriff: status ───────────────────────────────────────────────────────────
router.get(
  "/payriff/status/:paymentId",
  authenticate,
  async (req, res, next) => {
    try {
      const result = await getPayriffStatus(req.params.paymentId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ── Payriff: refund ───────────────────────────────────────────────────────────
router.post(
  "/payriff/refund",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res, next) => {
    try {
      const { paymentId, amount } = req.body;
      const result = await refundPayriff(paymentId, amount);
      const paymentRecord = await prisma.payment.findFirst({
        where: { externalRef: paymentId },
      });
      if (paymentRecord) {
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: "refunded",
            refundAmount: amount,
            refundedAt: new Date(),
          },
        });
      }
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ── M10: create QR ────────────────────────────────────────────────────────────
router.post("/m10/create", async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Sifariş tapılmadı" });

    const result = await createM10Payment({
      orderId,
      amount: order.total,
      note: `Sifariş #${order.orderNumber}`,
    });

    await prisma.payment.create({
      data: {
        orderId,
        method: "m10",
        provider: "m10",
        amount: order.total,
        status: "pending",
        externalRef: result.transactionRef,
      },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── M10: status (polling) ─────────────────────────────────────────────────────
router.get("/m10/status/:ref", async (req, res, next) => {
  try {
    const result = await getM10Status(req.params.ref);
    const isPaid = result.status === "SUCCESS";

    if (isPaid) {
      const payment = await prisma.payment.findFirst({
        where: { externalRef: req.params.ref, status: "pending" },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "success" },
        });
        const order = await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: "paid", paidAt: new Date() },
        });
        await notify({
          io: (req as any).io,
          branchId: order.branchId,
          type: "payment_received",
          title: "Ödəniş alındı (M10)",
          message: `#${order.orderNumber} — ${order.total.toFixed(2)} ₼`,
          data: { orderId: order.id },
        });
      }
    }

    res.json({ success: true, data: { status: result.status, isPaid } });
  } catch (err) {
    next(err);
  }
});

// ── M10: webhook ──────────────────────────────────────────────────────────────
router.post("/m10/webhook", async (req, res, next) => {
  try {
    const sig = req.headers["x-m10-signature"] as string;
    if (!verifyM10Webhook(JSON.stringify(req.body), sig)) {
      return res.status(401).json({ success: false });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as paymentRoutes };
