import { Router } from 'express';
import {
  createOrUpdateCompensation,
  getProjectCompensation,
  disburseCompensation,
} from '../controllers/compensationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'), createOrUpdateCompensation);
router.get('/project/:projectId', getProjectCompensation);
router.put('/:id/disburse', authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY'), disburseCompensation);

export default router;
