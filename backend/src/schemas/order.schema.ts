import { z } from 'zod';

export const createPurchaseOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Supplier is required'),
  warehouseId: z.string().uuid('Warehouse is required'),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  taxRate: z.number().min(0).default(18),
  items: z.array(createPurchaseOrderItemSchema).min(1, 'At least one product item is required'),
});

export const updatePOStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']),
  receivedItems: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantityReceived: z.number().int().nonnegative(),
      })
    )
    .optional(),
});
