import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { success, error } from '../utils/response';
import { generateReferenceId } from '../utils/crypto';

export class FineController {
  // GET /api/v1/fines
  async getFines(req: AuthRequest, res: any) {
    const fines = await prisma.fine.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    const total = fines.reduce((sum, f) => sum + f.accumulatedAmount, 0);
    success(res, { fines, total });
  }

  // POST /api/v1/fines/:id/pay
  async payFine(req: AuthRequest, res: any) {
    const fineId = req.params.id;
    const userId = req.user!.id;

    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine || fine.userId !== userId) return error(res, 'NOT_FOUND', 'Fine not found', 404);
    if (fine.status !== 'ACTIVE') return error(res, 'FINE_NOT_ACTIVE', 'This fine is no longer active', 400);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < fine.accumulatedAmount) {
      return error(res, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance to pay this fine', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!lockedWallet || lockedWallet.balance < fine.accumulatedAmount) throw new Error('Insufficient');

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: fine.accumulatedAmount } } });
      await tx.fine.update({ where: { id: fineId }, data: { status: 'PAID', paidAt: new Date() } });

      const ref = generateReferenceId('FIN');
      const txn = await tx.transaction.create({
        data: {
          referenceId: ref, walletId: wallet.id, type: 'FINE_PAYMENT', direction: 'DEBIT',
          amount: fine.accumulatedAmount, balanceBefore: lockedWallet.balance,
          balanceAfter: lockedWallet.balance - fine.accumulatedAmount,
          status: 'COMPLETED', gateway: 'WALLET',
          description: `Fine Payment: ${fine.description}`, initiatedBy: userId,
        },
      });

      await tx.fine.update({ where: { id: fineId }, data: { paymentTransactionId: txn.id } });

      // Check advising clearance
      const remainingFines = await tx.fine.count({ where: { userId, status: 'ACTIVE' } });
      if (remainingFines === 0) {
        await tx.advisingClearance.upsert({
          where: { studentId: userId },
          create: { studentId: userId, semester: 1, clearedAt: new Date(), autoCleared: true },
          update: { clearedAt: new Date(), blockedReason: null, autoCleared: true },
        });
      }

      return txn;
    });

    success(res, { message: 'Fine paid successfully', transaction: result });
  }

  // POST /api/v1/fines/pay-all
  async payAllFines(req: AuthRequest, res: any) {
    const userId = req.user!.id;

    const activeFines = await prisma.fine.findMany({ where: { userId, status: 'ACTIVE' } });
    if (activeFines.length === 0) return error(res, 'NO_FINES', 'No active fines to pay', 400);

    const totalAmount = activeFines.reduce((sum, f) => sum + f.accumulatedAmount, 0);
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < totalAmount) return error(res, 'INSUFFICIENT_BALANCE', 'Insufficient balance', 400);

    await prisma.$transaction(async (tx) => {
      const lockedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!lockedWallet || lockedWallet.balance < totalAmount) throw new Error('Insufficient');

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: totalAmount } } });

      for (const fine of activeFines) {
        const ref = generateReferenceId('FIN');
        const txn = await tx.transaction.create({
          data: {
            referenceId: ref, walletId: wallet.id, type: 'FINE_PAYMENT', direction: 'DEBIT',
            amount: fine.accumulatedAmount, status: 'COMPLETED', gateway: 'WALLET',
            description: `Fine Payment: ${fine.description}`, initiatedBy: userId,
          },
        });
        await tx.fine.update({ where: { id: fine.id }, data: { status: 'PAID', paidAt: new Date(), paymentTransactionId: txn.id } });
      }

      await tx.advisingClearance.upsert({
        where: { studentId: userId },
        create: { studentId: userId, semester: 1, clearedAt: new Date(), autoCleared: true },
        update: { clearedAt: new Date(), blockedReason: null, autoCleared: true },
      });
    });

    success(res, { message: `All ${activeFines.length} fines paid successfully`, totalAmount });
  }

  // POST /api/v1/fines/:id/appeal
  async appealFine(req: AuthRequest, res: any) {
    const fineId = req.params.id;
    const { statement, evidenceUrls } = req.body;

    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine || fine.userId !== req.user!.id) return error(res, 'NOT_FOUND', 'Fine not found', 404);
    if (fine.status !== 'ACTIVE') return error(res, 'FINE_NOT_ACTIVE', 'Cannot appeal this fine', 400);

    await prisma.fine.update({ where: { id: fineId }, data: { status: 'APPEALED' } });
    const appeal = await prisma.fineAppeal.create({
      data: { fineId, studentId: req.user!.id, statement, evidenceUrls: evidenceUrls || [] },
    });

    success(res, { appeal }, 201);
  }

  // GET /api/v1/advising/status
  async getAdvisingStatus(req: AuthRequest, res: any) {
    const clearance = await prisma.advisingClearance.findUnique({ where: { studentId: req.user!.id } });
    const activeFines = await prisma.fine.findMany({ where: { userId: req.user!.id, status: 'ACTIVE' } });
    const tuitionRecords = await prisma.tuitionRecord.findMany({ where: { studentId: req.user!.id } });

    success(res, {
      clearance: clearance ? { clearedAt: clearance.clearedAt, blockedReason: clearance.blockedReason, autoCleared: clearance.autoCleared } : null,
      isCleared: !!clearance?.clearedAt,
      activeFines,
      tuitionRecords,
    });
  }
}
