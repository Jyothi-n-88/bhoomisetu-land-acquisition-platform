import { Router } from 'express';
import {
  createParcel,
  getParcels,
  getParcel,
  updateParcel,
  deleteParcel,
  updateParcelWorkflow,
  getProjectGeoJSON
} from '../controllers/parcelController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router
  .route('/project/:projectId/geojson')
  .get(getProjectGeoJSON);

router
  .route('/')
  .get(getParcels)
  .post(
    authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'),
    createParcel
  );

router
  .route('/:id/workflow')
  .put(
    authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'),
    updateParcelWorkflow
  );

router
  .route('/:id')
  .get(getParcel)
  .put(
    authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'FIELD_OFFICER'),
    updateParcel
  )
  .delete(authorize('CENTRAL_AUTHORITY', 'STATE_AUTHORITY'), deleteParcel);

export default router;
