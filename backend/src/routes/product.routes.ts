import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

router.get('/categories', authenticate, getCategories);
router.get('/', authenticate, getProducts);
router.get('/:id', authenticate, getProductById);
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_STAFF']),
  validateRequest(createProductSchema),
  createProduct
);
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_STAFF']),
  validateRequest(updateProductSchema),
  updateProduct
);
router.delete('/:id', authenticate, authorize(['ADMIN', 'WAREHOUSE_MANAGER']), deleteProduct);

export default router;
