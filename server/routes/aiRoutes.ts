import { Router } from 'express';
import { analyzeProjectHealth, exportProjectReport } from '../controllers/aiController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all AI routes
router.use(protect);

router.post('/project/:projectId/analyze', authorize('Central_Authority', 'State_Authority', 'District_Authority'), analyzeProjectHealth);
router.get('/project/:projectId/export-report', authorize('Central_Authority', 'State_Authority', 'District_Authority'), exportProjectReport);

export default router;
