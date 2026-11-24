import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_STAFF', 'VIEWER']).optional().default('INVENTORY_STAFF'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  resetCode: z.string().min(6, 'Reset code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_STAFF', 'VIEWER']),
  phone: z.string().optional(),
  warehouseId: z.string().uuid().optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});
