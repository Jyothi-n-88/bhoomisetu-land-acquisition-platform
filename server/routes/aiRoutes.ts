import { Router } from 'express';
import { analyzeProjectHealth, exportProjectReport } from '../controllers/aiController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all AI routes
router.use(protect);

router.post('/project/:projectId/analyze', authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'), analyzeProjectHealth);
router.get('/project/:projectId/export-report', authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'), exportProjectReport);

export default router;
