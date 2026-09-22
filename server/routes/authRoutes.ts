import { Router } from 'express';
import { register, login, getMe, logout, ssoLogin, ssoRegister, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { uploadIdProof } from '../middleware/uploadMiddleware';

const router = Router();

router.post('/register', uploadIdProof.single('idProof'), register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/sso-login', ssoLogin);
router.post('/sso-register', ssoRegister);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
