import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const createOrderSchema = z.object({
  tableId: z.string().min(1),
  branchId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        selectedSizeId: z.string().optional(),
        selectedExtras: z.array(z.string()).optional(),
        specialNote: z.string().max(500).optional(),
      }),
    )
    .min(1, "Order must have at least one item"),
  paymentMethod: z.enum(["cash", "card", "online"]),
  specialRequest: z.string().max(500).optional(),
  discountCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "served",
    "cancelled",
  ]),
  estimatedTime: z.number().int().min(1).optional(),
  cancelReason: z.string().max(300).optional(),
});

export const waiterRequestSchema = z.object({
  tableId: z.string().min(1),
  type: z.enum(["call", "bill", "water", "napkin", "clean", "other"]),
  message: z.string().max(300).optional(),
});

export const waiterRequestStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "done", "rejected"]),
  rejectionNote: z.string().max(300).optional(),
});

export const staffCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2),
  role: z.enum(["admin", "manager", "kitchen", "waiter"]),
});

export const qrValidateSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
});
