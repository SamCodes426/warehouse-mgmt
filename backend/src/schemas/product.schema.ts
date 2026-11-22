import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required').regex(/^[A-Za-z0-9-_]+$/, 'SKU must only contain alphanumeric characters, hyphens or underscores'),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid('Valid Category ID is required'),
  unit: z.string().default('pcs'),
  costPrice: z.number().nonnegative('Cost price must be non-negative'),
  sellingPrice: z.number().nonnegative('Selling price must be non-negative'),
  minStockLevel: z.number().int().nonnegative().default(10),
  defaultSupplierId: z.string().uuid().optional().nullable(),
  initialWarehouseId: z.string().uuid().optional(),
  initialLocationId: z.string().uuid().optional().nullable(),
  initialStock: z.number().int().nonnegative().optional().default(0),
});

export const updateProductSchema = createProductSchema.partial().omit({ initialWarehouseId: true, initialLocationId: true, initialStock: true });
