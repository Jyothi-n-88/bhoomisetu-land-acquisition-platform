import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import parcelRoutes from './parcelRoutes';
import compensationRoutes from './compensationRoutes';
import rnrRoutes from './rnrRoutes';
import aiRoutes from './aiRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/parcels', parcelRoutes);
router.use('/compensation', compensationRoutes);
router.use('/rnr', rnrRoutes);
router.use('/ai', aiRoutes);
router.get('/health', getHealthStatus);

export default router;
