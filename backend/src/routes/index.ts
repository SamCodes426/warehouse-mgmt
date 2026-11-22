import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import movementRoutes from './movement.routes';
import warehouseRoutes from './warehouse.routes';
import supplierRoutes from './supplier.routes';
import orderRoutes from './order.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/movements', movementRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

export default router;
