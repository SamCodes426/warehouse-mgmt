import { Router } from 'express';
import { getInventoryReport, exportReportCSV } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/inventory', authenticate, getInventoryReport);
router.get('/export/csv', authenticate, exportReportCSV);

export default router;
