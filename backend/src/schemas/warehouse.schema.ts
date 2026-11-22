import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name is required'),
  code: z.string().min(2, 'Warehouse code is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  managerName: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  capacity: z.number().int().positive().default(10000),
});

export const createLocationSchema = z.object({
  warehouseId: z.string().uuid(),
  zone: z.string().min(1, 'Zone is required'),
  aisle: z.string().min(1, 'Aisle is required'),
  rack: z.string().min(1, 'Rack is required'),
  shelf: z.string().min(1, 'Shelf is required'),
  bin: z.string().min(1, 'Bin is required'),
  code: z.string().min(2, 'Location code is required'),
  capacity: z.number().int().positive().default(500),
});
