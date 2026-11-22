import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createSupplierSchema } from '../schemas/supplier.schema';

const router = Router();

router.get('/', authenticate, getSuppliers);
router.get('/:id', authenticate, getSupplierById);
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(createSupplierSchema),
  createSupplier
);
router.put('/:id', authenticate, authorize(['ADMIN', 'WAREHOUSE_MANAGER']), updateSupplier);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteSupplier);

export default router;
