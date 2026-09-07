import { Router } from 'express';
import {
  createOrUpdateRnr,
  getProjectRnr,
} from '../controllers/rnrController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'), createOrUpdateRnr);
router.get('/project/:projectId', getProjectRnr);

export default router;
