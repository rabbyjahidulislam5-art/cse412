import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { success, error } from '../utils/response';
import { generateReferenceId } from '../utils/crypto';

export class PaymentWebhookController {
  // POST /api/v1/payments/webhook/sslcommerz
  async sslcommerzWebhook(req: Request, res: Response) {
    const { tran_id, status, val_id, amount, card_type, store_amount, currency } = req.body;

    if (status !== 'VALID') {
      await prisma.paymentIntent.updateMany({ where: { id: tran_id }, data: { status: 'FAILED' } });
      return res.status(200).json({ status: 'RECEIVED' });
    }

    const intent = await prisma.paymentIntent.findUnique({ where: { id: tran_id } });
    if (!intent || intent.status !== 'PENDING') return res.status(200).json({ status: 'DUPLICATE' });

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: intent.userId } });
      if (!wallet) throw new Error('Wallet not found');

      const balanceBefore = wallet.balance;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: intent.amount }, dailyTopupUsed: { increment: intent.amount } } });

      const ref = generateReferenceId('TOP');
      const transaction = await tx.transaction.create({
        data: {
          referenceId: ref, walletId: wallet.id, type: 'TOP_UP', direction: 'CREDIT',
          amount: intent.amount, balanceBefore, balanceAfter: balanceBefore + intent.amount,
          status: 'COMPLETED', gateway: 'SSLCommerz', gatewayRef: val_id,
          description: `Top-up via SSLCommerz (Card)`, initiatedBy: intent.userId,
        },
      });

      await tx.paymentIntent.update({
        where: { id: intent.id }, data: { status: 'COMPLETED', completedAt: new Date(), gatewayRef: val_id, transactionId: transaction.id },
      });

      await tx.notification.create({
        data: { userId: intent.userId, type: 'WALLET', title: 'Wallet Top-Up', message: `Wallet topped up with ৳${intent.amount / 100} via SSLCommerz.`, channel: 'IN_APP', status: 'PENDING' },
      });
    });

    res.status(200).json({ status: 'SUCCESS' });
  }

  // POST /api/v1/payments/webhook/bkash
  async bkashWebhook(req: Request, res: Response) {
    const { paymentID, status, trxID, amount, intent_id } = req.body;

    if (status !== 'success' && status !== 'completed') {
      if (intent_id) await prisma.paymentIntent.updateMany({ where: { id: intent_id }, data: { status: 'FAILED' } });
      return res.status(200).json({ status: 'RECEIVED' });
    }

    const intent = await prisma.paymentIntent.findUnique({ where: { id: intent_id } });
    if (!intent || intent.status !== 'PENDING') return res.status(200).json({ status: 'DUPLICATE' });

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: intent.userId } });
      if (!wallet) throw new Error('Wallet not found');

      const balanceBefore = wallet.balance;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: intent.amount }, dailyTopupUsed: { increment: intent.amount } } });

      const ref = generateReferenceId('TOP');
      await tx.transaction.create({
        data: {
          referenceId: ref, walletId: wallet.id, type: 'TOP_UP', direction: 'CREDIT',
          amount: intent.amount, balanceBefore, balanceAfter: balanceBefore + intent.amount,
          status: 'COMPLETED', gateway: 'bkash', gatewayRef: trxID,
          description: `Top-up via bKash`, initiatedBy: intent.userId,
        },
      });

      await tx.paymentIntent.update({ where: { id: intent.id }, data: { status: 'COMPLETED', completedAt: new Date(), gatewayRef: trxID } });
      await tx.notification.create({
        data: { userId: intent.userId, type: 'WALLET', title: 'Wallet Top-Up', message: `Wallet topped up with ৳${intent.amount / 100} via bKash.`, channel: 'IN_APP', status: 'PENDING' },
      });
    });

    res.status(200).json({ status: 'SUCCESS' });
  }

  // POST /api/v1/payments/webhook/nagad
  async nagadWebhook(req: Request, res: Response) {
    // Similar to bkash but for Nagad gateway
    const { payment_ref_id, status, intent, amount } = req.body;

    if (status !== 'Success') {
      if (intent) await prisma.paymentIntent.updateMany({ where: { id: intent }, data: { status: 'FAILED' } });
      return res.status(200).json({ status: 'RECEIVED' });
    }

    const intentRec = await prisma.paymentIntent.findUnique({ where: { id: intent } });
    if (!intentRec || intentRec.status !== 'PENDING') return res.status(200).json({ status: 'DUPLICATE' });

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: intentRec.userId } });
      if (!wallet) throw new Error('Wallet not found');

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: intentRec.amount }, dailyTopupUsed: { increment: intentRec.amount } } });

      await tx.paymentIntent.update({ where: { id: intentRec.id }, data: { status: 'COMPLETED', completedAt: new Date(), gatewayRef: payment_ref_id } });
      await tx.notification.create({
        data: { userId: intentRec.userId, type: 'WALLET', title: 'Wallet Top-Up', message: `Wallet topped up with ৳${intentRec.amount / 100} via Nagad.`, channel: 'IN_APP', status: 'PENDING' },
      });
    });

    res.status(200).json({ status: 'SUCCESS' });
  }
}
