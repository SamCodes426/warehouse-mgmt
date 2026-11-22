import { Router } from 'express';
import { getMovements, recordStockMovement } from '../controllers/movement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { stockMovementSchema } from '../schemas/movement.schema';

const router = Router();

router.get('/', authenticate, getMovements);
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_STAFF']),
  validateRequest(stockMovementSchema),
  recordStockMovement
);

export default router;
