import { Router } from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePOStatus,
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createPurchaseOrderSchema, updatePOStatusSchema } from '../schemas/order.schema';

const router = Router();

router.get('/', authenticate, getPurchaseOrders);
router.get('/:id', authenticate, getPurchaseOrderById);
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(createPurchaseOrderSchema),
  createPurchaseOrder
);
router.patch(
  '/:id/status',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(updatePOStatusSchema),
  updatePOStatus
);

export default router;
