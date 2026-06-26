import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema, changePasswordSchema, supportTicketSchema } from '../dtos';

const router = Router();
const controller = new StudentController();

router.get('/profile', authenticate, controller.getProfile.bind(controller));
router.put('/profile', authenticate, validate(updateProfileSchema), controller.updateProfile.bind(controller));
router.get('/dashboard', authenticate, requireRole('STUDENT'), controller.getDashboard.bind(controller));
router.get('/notifications', authenticate, controller.getNotifications.bind(controller));
router.put('/notifications/read-all', authenticate, controller.markAllRead.bind(controller));
router.get('/security/activity', authenticate, controller.getActivityLog.bind(controller));
router.post('/security/revoke-session', authenticate, controller.revokeSession.bind(controller));
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword.bind(controller));
router.post('/support/ticket', authenticate, validate(supportTicketSchema), controller.createSupportTicket.bind(controller));
router.get('/support/tickets', authenticate, controller.getSupportTickets.bind(controller));

export default router;
