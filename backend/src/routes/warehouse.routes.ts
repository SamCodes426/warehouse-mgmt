import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createLocation,
} from '../controllers/warehouse.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createWarehouseSchema, createLocationSchema } from '../schemas/warehouse.schema';

const router = Router();

router.get('/', authenticate, getWarehouses);
router.get('/:id', authenticate, getWarehouseById);
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(createWarehouseSchema),
  createWarehouse
);
router.put('/:id', authenticate, authorize(['ADMIN', 'WAREHOUSE_MANAGER']), updateWarehouse);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteWarehouse);
router.post(
  '/locations',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(createLocationSchema),
  createLocation
);

export default router;
