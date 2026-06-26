import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { success, error, paginated } from '../utils/response';
import { generateReferenceId } from '../utils/crypto';
import { config } from '../config';

export class WalletController {
  // GET /api/v1/wallet/balance
  async getBalance(req: AuthRequest, res: any) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) return error(res, 'NOT_FOUND', 'Wallet not found', 404);
    success(res, { balance: wallet.balance, pendingBalance: wallet.pendingBalance, heldBalance: wallet.heldBalance, status: wallet.status });
  }

  // POST /api/v1/wallet/topup/initiate
  async initiateTopUp(req: AuthRequest, res: any) {
    const { amount, gateway } = req.body;
    const userId = req.user!.id;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return error(res, 'NOT_FOUND', 'Wallet not found', 404);
    if (wallet.status !== 'ACTIVE') return error(res, 'WALLET_FROZEN', 'Wallet is not active', 403);

    // Check daily limit
    if (wallet.dailyTopupResetAt < new Date()) {
      await prisma.wallet.update({ where: { id: wallet.id }, data: { dailyTopupUsed: 0, dailyTopupResetAt: new Date() } });
    }
    if ((wallet.dailyTopupUsed + amount) > config.wallet.dailyTopUpMax) {
      return error(res, 'LIMIT_EXCEEDED', 'Daily top-up limit exceeded', 400);
    }

    // Check single transaction limit
    if (amount > config.wallet.singleTopUpMax) {
      return error(res, 'AMOUNT_TOO_HIGH', `Maximum single top-up is ৳${config.wallet.singleTopUpMax / 100}`, 400);
    }

    // Check max balance
    if ((wallet.balance + amount) > config.wallet.maxBalance) {
      return error(res, 'MAX_BALANCE', 'This top-up would exceed maximum wallet balance', 400);
    }

    const intent = await prisma.paymentIntent.create({
      data: {
        userId, amount, gateway,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    // In production: redirect to gateway (bKash/Nagad/SSLCommerz)
    const gatewayRedirect = gateway === 'bkash' ? `https://checkout.pay.bkash.com/v1.2.0-beta/checkout/payment/${intent.id}` :
      gateway === 'nagad' ? `https://nagad.com/pay/${intent.id}` :
        `https://sandbox.sslcommerz.com/EcomCheckOut/checkouts/${intent.id}`;

    success(res, { intentId: intent.id, gatewayRedirect, amount });
  }

  // POST /api/v1/wallet/transfer
  async transfer(req: AuthRequest, res: any) {
    const { recipientStudentId, amount, note, otp } = req.body;
    const senderId = req.user!.id;

    const wallet = await prisma.wallet.findUnique({ where: { userId: senderId } });
    if (!wallet) return error(res, 'NOT_FOUND', 'Wallet not found', 404);
    if (wallet.balance < amount) return error(res, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance', 400);
    if (amount > config.wallet.singleTransferMax) return error(res, 'LIMIT_EXCEEDED', 'Single transfer limit exceeded', 400);

    // OTP check for large transfers
    if (amount > config.wallet.transferOtpThreshold) {
      if (!otp) return error(res, 'OTP_REQUIRED', 'OTP required for transfers above ৳500', 400);
      const record = await prisma.oTPRecord.findFirst({
        where: { userId: senderId, purpose: 'TRANSFER', usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!record || record.otpHash !== (await import('../utils/crypto')).hashOTP(otp)) {
        return error(res, 'OTP_INVALID', 'Invalid OTP', 400);
      }
      await prisma.oTPRecord.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    }

    const recipient = await prisma.user.findUnique({ where: { studentId: recipientStudentId } });
    if (!recipient || recipient.status !== 'ACTIVE') return error(res, 'RECIPIENT_NOT_FOUND', 'Recipient not found or inactive', 404);

    const recipientWallet = await prisma.wallet.findUnique({ where: { userId: recipient.id } });
    if (!recipientWallet || recipientWallet.status !== 'ACTIVE') return error(res, 'RECIPIENT_WALLET_INVALID', 'Recipient wallet not available', 400);

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const lockedSenderWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!lockedSenderWallet || lockedSenderWallet.balance < amount) throw new Error('Insufficient balance');

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
      await tx.wallet.update({ where: { id: recipientWallet.id }, data: { balance: { increment: amount } } });

      const refOut = generateReferenceId('TXO');
      const refIn = generateReferenceId('TXI');

      const debitTx = await tx.transaction.create({
        data: {
          referenceId: refOut, walletId: wallet.id, type: 'TRANSFER_OUT', direction: 'DEBIT',
          amount, balanceBefore: lockedSenderWallet.balance, balanceAfter: lockedSenderWallet.balance - amount,
          status: 'COMPLETED', gateway: 'WALLET', relatedUserId: recipient.id,
          description: `Transfer to ${recipient.studentId}${note ? ` - ${note}` : ''}`, initiatedBy: senderId,
        },
      });

      const creditTx = await tx.transaction.create({
        data: {
          referenceId: refIn, walletId: recipientWallet.id, type: 'TRANSFER_IN', direction: 'CREDIT',
          amount, balanceBefore: recipientWallet.balance, balanceAfter: recipientWallet.balance + amount,
          status: 'COMPLETED', gateway: 'WALLET', relatedUserId: senderId,
          description: `Transfer from ${req.user?.role === 'STUDENT' ? '' : 'user'}${note ? ` - ${note}` : ''}`, initiatedBy: senderId,
        },
      });

      return { debitTx, creditTx };
    });

    success(res, { message: 'Transfer successful', transaction: result.debitTx });
  }

  // POST /api/v1/wallet/qr-pay
  async qrPay(req: AuthRequest, res: any) {
    const { qrPayload: qrString, amount, otp } = req.body;
    const userId = req.user!.id;

    let payload: any;
    try { payload = JSON.parse(qrString); } catch { return error(res, 'INVALID_QR', 'Invalid QR code data', 400); }

    const merchant = await prisma.merchant.findUnique({ where: { id: payload.merchantId } });
    if (!merchant || merchant.status !== 'ACTIVE') return error(res, 'INVALID_MERCHANT', 'Merchant not found or inactive', 404);

    const payAmount = amount || (payload.amount ? Math.round(payload.amount * 100) : 0); // to paisa
    if (payAmount <= 0) return error(res, 'INVALID_AMOUNT', 'Amount required for payment', 400);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < payAmount) return error(res, 'INSUFFICIENT_BALANCE', 'Insufficient balance', 400);

    // OTP for large QR payments
    if (payAmount > config.wallet.qrPayOtpThreshold) {
      if (!otp) return error(res, 'OTP_REQUIRED', 'OTP required for payments above ৳1,000', 400);
      const record = await prisma.oTPRecord.findFirst({
        where: { userId, purpose: 'QR_PAY', usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!record || record.otpHash !== (await import('../utils/crypto')).hashOTP(otp)) {
        return error(res, 'OTP_INVALID', 'Invalid OTP', 400);
      }
      await prisma.oTPRecord.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    }

    // Atomic QR payment
    const result = await prisma.$transaction(async (tx) => {
      const lockedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!lockedWallet || lockedWallet.balance < payAmount) throw new Error('Insufficient balance');

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: payAmount } } });
      await tx.merchant.update({ where: { id: merchant.id }, data: { pendingBalance: { increment: payAmount }, dailyVolume: { increment: payAmount } } });

      const ref = generateReferenceId('QRP');
      const debitTx = await tx.transaction.create({
        data: {
          referenceId: ref, walletId: wallet.id, type: 'PAYMENT', direction: 'DEBIT',
          amount: payAmount, balanceBefore: lockedWallet.balance, balanceAfter: lockedWallet.balance - payAmount,
          status: 'COMPLETED', gateway: 'WALLET',
          description: `QR Payment to ${merchant.shopName}`, initiatedBy: userId,
          metadata: { merchantId: merchant.id, qrType: payload.type },
        },
      });

      await tx.merchantTransaction.create({
        data: { merchantId: merchant.id, transactionId: debitTx.id, status: 'COMPLETED', settlementAmount: payAmount },
      });

      return { transaction: debitTx };
    });

    success(res, { message: 'Payment successful', ...result });
  }

  // POST /api/v1/wallet/withdraw
  async withdraw(req: AuthRequest, res: any) {
    const { amount, destination } = req.body;
    const userId = req.user!.id;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return error(res, 'NOT_FOUND', 'Wallet not found', 404);
    if (wallet.balance < amount) return error(res, 'INSUFFICIENT_BALANCE', 'Insufficient balance', 400);
    if (amount < config.wallet.withdrawalMin) return error(res, 'AMOUNT_TOO_LOW', `Minimum withdrawal is ৳${config.wallet.withdrawalMin / 100}`, 400);

    const ref = generateReferenceId('WDR');
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
      await tx.transaction.create({
        data: {
          referenceId: ref, walletId: wallet.id, type: 'WITHDRAWAL', direction: 'DEBIT',
          amount, balanceBefore: wallet.balance, balanceAfter: wallet.balance - amount,
          status: 'PENDING', description: `Withdrawal to ${destination}`, initiatedBy: userId,
          metadata: { destination },
        },
      });
    });

    success(res, { message: 'Withdrawal request submitted', referenceId: ref });
  }

  // GET /api/v1/wallet/transactions
  async getTransactions(req: AuthRequest, res: any) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) return error(res, 'NOT_FOUND', 'Wallet not found', 404);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const direction = req.query.direction as string;

    const where: any = { walletId: wallet.id };
    if (type) where.type = type;
    if (direction) where.direction = direction;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.transaction.count({ where }),
    ]);

    paginated(res, transactions, page, limit, total);
  }

  // GET /api/v1/wallet/ledger
  async getLedger(req: AuthRequest, res: any) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) return error(res, 'NOT_FOUND', 'Wallet not found', 404);

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'asc' },
    });

    success(res, { balance: wallet.balance, transactions });
  }
}
