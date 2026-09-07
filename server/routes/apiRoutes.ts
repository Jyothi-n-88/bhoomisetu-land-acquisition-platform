import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import parcelRoutes from './parcelRoutes';
import compensationRoutes from './compensationRoutes';
import rnrRoutes from './rnrRoutes';
<<<<<<< HEAD
import aiRoutes from './aiRoutes';
=======
>>>>>>> origin/main

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/parcels', parcelRoutes);
router.use('/compensation', compensationRoutes);
router.use('/rnr', rnrRoutes);
<<<<<<< HEAD
router.use('/ai', aiRoutes);
=======
>>>>>>> origin/main
router.get('/health', getHealthStatus);

export default router;
