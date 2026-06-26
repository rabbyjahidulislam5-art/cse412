import { Router } from 'express';
import { PaymentWebhookController } from '../controllers/webhook.controller';

const router = Router();
const controller = new PaymentWebhookController();

router.post('/webhook/sslcommerz', controller.sslcommerzWebhook.bind(controller));
router.post('/webhook/bkash', controller.bkashWebhook.bind(controller));
router.post('/webhook/nagad', controller.nagadWebhook.bind(controller));

export default router;
