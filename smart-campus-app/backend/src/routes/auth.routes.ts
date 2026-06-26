import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate, requirePartialAuth, refreshAccessToken } from '../middleware/auth.middleware';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware';
import { registerSchema, loginSchema, verifyOTPSchema, verify2FASchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../dtos';

const router = Router();
const controller = new AuthController();

router.post('/register', authLimiter, validate(registerSchema), controller.register.bind(controller));
router.post('/verify-otp', otpLimiter, validate(verifyOTPSchema), requirePartialAuth, controller.verifyOTP.bind(controller));
router.post('/login', authLimiter, validate(loginSchema), controller.login.bind(controller));
router.post('/2fa/verify', validate(verify2FASchema), requirePartialAuth, controller.verify2FA.bind(controller));
router.post('/refresh', refreshAccessToken, controller.refresh.bind(controller));
router.post('/logout', authenticate, controller.logout.bind(controller));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword.bind(controller));
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword.bind(controller));
router.post('/setup-2fa', authenticate, controller.setup2FA.bind(controller));
router.post('/enable-2fa', authenticate, validate(verify2FASchema), controller.enable2FA.bind(controller));
router.post('/kyc/upload', authenticate, controller.uploadKYC.bind(controller));

export default router;
