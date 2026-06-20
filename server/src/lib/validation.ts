import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'kitchen', 'waiter', 'staff']).default('staff'),
});

export const OrderCreateSchema = z.object({
  tableId: z.string().uuid('Invalid table ID'),
  branchId: z.string().uuid('Invalid branch ID'),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    selectedSizeId: z.string().uuid().optional(),
    selectedExtras: z.array(z.string().uuid()).optional().default([]),
    specialNote: z.string().optional(),
  })).min(1, 'Order must have at least one item'),
  paymentMethod: z.enum(['cash', 'card', 'online']),
  specialRequest: z.string().optional(),
  discountCode: z.string().optional(),
});

export const OrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled']),
  estimatedTime: z.number().int().optional(),
});

export const WaiterRequestSchema = z.object({
  tableId: z.string().uuid(),
  type: z.enum(['call', 'water', 'napkin', 'bill', 'clean', 'other']),
  message: z.string().optional(),
});

export const WaiterRequestStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'done']),
  waiterId: z.string().optional(),
});

export const QRValidateSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
});

export const CouponSchema = z.object({
  code: z.string().min(3),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  usageLimit: z.number().int().optional(),
});
