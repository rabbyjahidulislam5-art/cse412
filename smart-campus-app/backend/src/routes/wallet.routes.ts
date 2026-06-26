import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { topUpSchema, transferSchema, qrPaySchema, withdrawSchema } from '../dtos';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const controller = new WalletController();

router.get('/balance', authenticate, controller.getBalance.bind(controller));
router.post('/topup/initiate', authenticate, requireRole('STUDENT'), paymentLimiter, validate(topUpSchema), controller.initiateTopUp.bind(controller));
router.post('/transfer', authenticate, requireRole('STUDENT'), paymentLimiter, validate(transferSchema), controller.transfer.bind(controller));
router.post('/qr-pay', authenticate, requireRole('STUDENT'), paymentLimiter, controller.qrPay.bind(controller));
router.post('/withdraw', authenticate, validate(withdrawSchema), controller.withdraw.bind(controller));
router.get('/transactions', authenticate, controller.getTransactions.bind(controller));
router.get('/ledger', authenticate, controller.getLedger.bind(controller));

export default router;
