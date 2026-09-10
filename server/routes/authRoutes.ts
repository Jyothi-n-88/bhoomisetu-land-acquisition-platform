import { Router } from 'express';
import { register, login, getMe, logout, ssoLogin, ssoRegister, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/sso-login', ssoLogin);
router.post('/sso-register', ssoRegister);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
