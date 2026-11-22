import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Contact person/supplier name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone number is required'),
  address: z.string().min(3, 'Address is required'),
  gstNumber: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
});
