import { Router } from 'express';
import { FineController } from '../controllers/fine.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { fineAppealSchema } from '../dtos';

const router = Router();
const controller = new FineController();

router.get('/', authenticate, controller.getFines.bind(controller));
router.post('/:id/pay', authenticate, requireRole('STUDENT'), controller.payFine.bind(controller));
router.post('/pay-all', authenticate, requireRole('STUDENT'), controller.payAllFines.bind(controller));
router.post('/:id/appeal', authenticate, validate(fineAppealSchema), controller.appealFine.bind(controller));
router.get('/advising/status', authenticate, controller.getAdvisingStatus.bind(controller));

export default router;
