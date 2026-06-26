import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { addFineSchema, waiveFineSchema, suspendAccountSchema, broadcastNotificationSchema } from '../dtos';

const router = Router();
const controller = new AdminController();

router.get('/dashboard', authenticate, requireRole('ADMIN'), controller.getDashboard.bind(controller));
router.get('/students', authenticate, requireRole('ADMIN'), controller.getStudents.bind(controller));
router.get('/students/:id', authenticate, requireRole('ADMIN'), controller.getStudentDetail.bind(controller));
router.post('/students/:id/suspend', authenticate, requireRole('ADMIN'), validate(suspendAccountSchema), controller.suspendStudent.bind(controller));
router.get('/kyc/queue', authenticate, requireRole('ADMIN'), controller.getKYCQueue.bind(controller));
router.put('/kyc/:id/decision', authenticate, requireRole('ADMIN'), controller.kycDecision.bind(controller));
router.get('/transactions', authenticate, requireRole('ADMIN'), controller.getTransactions.bind(controller));
router.post('/transaction/:id/override', authenticate, requireRole('ADMIN'), controller.overrideTransaction.bind(controller));
router.get('/fines', authenticate, requireRole('ADMIN'), controller.getAllFines.bind(controller));
router.post('/fines', authenticate, requireRole('ADMIN'), validate(addFineSchema), controller.addFine.bind(controller));
router.post('/fines/:id/waive', authenticate, requireRole('ADMIN'), validate(waiveFineSchema), controller.waiveFine.bind(controller));
router.get('/wallets', authenticate, requireRole('ADMIN'), controller.getWallets.bind(controller));
router.get('/audit', authenticate, requireRole('ADMIN'), controller.getAuditLogs.bind(controller));
router.get('/security', authenticate, requireRole('ADMIN'), controller.getSecurityEvents.bind(controller));
router.get('/support', authenticate, requireRole('ADMIN'), controller.getSupportTickets.bind(controller));
router.post('/notifications/broadcast', authenticate, requireRole('ADMIN'), validate(broadcastNotificationSchema), controller.broadcastNotification.bind(controller));
router.get('/reports/financial', authenticate, requireRole('ADMIN'), controller.getFinancialReport.bind(controller));

export default router;
