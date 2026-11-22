import { Router } from 'express';
import { login, getMe, getUsers, createUser } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { loginSchema, createUserSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize(['ADMIN', 'WAREHOUSE_MANAGER']), getUsers);
router.post('/users', authenticate, authorize(['ADMIN']), validateRequest(createUserSchema), createUser);

export default router;
