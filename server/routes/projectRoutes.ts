import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectBlockers,
  getDashboardMetrics
} from '../controllers/projectController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/dashboard/metrics', getDashboardMetrics);

router
  .route('/')
  .get(getProjects)
  .post(authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY'), createProject);

router.get('/:id/blockers', getProjectBlockers);

router
  .route('/:id')
  .get(getProject)
  .put(authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY'), updateProject)
  .delete(authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY'), deleteProject);

export default router;
