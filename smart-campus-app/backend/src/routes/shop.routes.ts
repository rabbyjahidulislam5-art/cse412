import { Router } from 'express';
import { ShopController } from '../controllers/shop.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { merchantProfileSchema, withdrawalRequestSchema } from '../dtos';

const router = Router();
const controller = new ShopController();

router.get('/dashboard', authenticate, requireRole('SHOP_OWNER'), controller.getDashboard.bind(controller));
router.get('/qr', authenticate, requireRole('SHOP_OWNER'), controller.getQR.bind(controller));
router.post('/qr/dynamic', authenticate, requireRole('SHOP_OWNER'), controller.generateDynamicQR.bind(controller));
router.get('/transactions', authenticate, requireRole('SHOP_OWNER'), controller.getTransactions.bind(controller));
router.get('/settlement', authenticate, requireRole('SHOP_OWNER'), controller.getSettlement.bind(controller));
router.post('/withdrawal', authenticate, requireRole('SHOP_OWNER'), validate(withdrawalRequestSchema), controller.requestWithdrawal.bind(controller));
router.get('/reports', authenticate, requireRole('SHOP_OWNER'), controller.getReports.bind(controller));
router.get('/profile', authenticate, requireRole('SHOP_OWNER'), controller.getProfile.bind(controller));
router.put('/profile', authenticate, requireRole('SHOP_OWNER'), validate(merchantProfileSchema), controller.updateProfile.bind(controller));
router.get('/refunds', authenticate, requireRole('SHOP_OWNER'), controller.getRefunds.bind(controller));

export default router;
