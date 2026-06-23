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

export const createOrderSchema = z
  .object({
    tableId: z.string().min(1).optional(),
    branchId: z.string().min(1),
    fulfillmentType: z.enum(["delivery", "takeaway", "dine_in"]).default("dine_in"),
    customerName: z.string().trim().max(120).optional(),
    customerPhone: z.string().trim().max(40).optional(),
    deliveryAddress: z.string().trim().max(300).optional(),
    deliveryNote: z.string().trim().max(300).optional(),
    pickupTime: z.string().datetime().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === "dine_in" && !data.tableId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tableId"],
        message: "Table is required for dine-in orders",
      });
    }

    if (data.fulfillmentType === "delivery") {
      if (!data.customerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerName"],
          message: "Customer name is required for delivery orders",
        });
      }
      if (!data.customerPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerPhone"],
          message: "Customer phone is required for delivery orders",
        });
      }
      if (!data.deliveryAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deliveryAddress"],
          message: "Delivery address is required for delivery orders",
        });
      }
    }

    if (data.fulfillmentType === "takeaway" && !data.customerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerName"],
        message: "Customer name is required for takeaway orders",
      });
    }
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
  status: z.enum(["active", "inactive"]).optional(),
});

export const qrValidateSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
});
