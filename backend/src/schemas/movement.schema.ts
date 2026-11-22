import { z } from 'zod';

export const stockMovementSchema = z.object({
  productId: z.string().uuid('Valid product ID is required'),
  warehouseId: z.string().uuid('Valid warehouse ID is required'),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'ADJUSTMENT']),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  referenceNumber: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});
