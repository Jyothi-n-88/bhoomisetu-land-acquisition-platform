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
<<<<<<< HEAD
  .delete(authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY'), deleteProject);
=======
  .delete(authorize('CENTRAL_AUTHORITY'), deleteProject);
>>>>>>> e6a08d41e062aea8318adf9b32f24f0f2bbe50a9

export default router;
