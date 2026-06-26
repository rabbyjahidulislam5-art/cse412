import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { success, error, paginated } from '../utils/response';
import { generateMerchantQR, generateDynamicQR } from '../utils/qr';
import { generateReferenceId } from '../utils/crypto';

export class ShopController {
  // GET /api/v1/shop/dashboard
  async getDashboard(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const todayTx = await prisma.merchantTransaction.findMany({
      where: { merchantId: merchant.id, createdAt: { gte: today } },
      include: { transaction: true },
    });

    const todayRevenue = todayTx.reduce((sum, t) => sum + (t.settlementAmount || 0), 0);

    const recentTx = await prisma.merchantTransaction.findMany({
      where: { merchantId: merchant.id },
      take: 10, orderBy: { createdAt: 'desc' },
      include: { transaction: { include: { wallet: { include: { user: { select: { fullName: true, studentId: true } } } } } } },
    });

    success(res, {
      merchant: { shopName: merchant.shopName, category: merchant.category },
      todayRevenue, todayTxCount: todayTx.length,
      pendingBalance: merchant.pendingBalance,
      availableBalance: merchant.availableBalance,
      recentTransactions: recentTx,
    });
  }

  // GET /api/v1/shop/qr
  async getQR(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);

    const qrDataURL = await generateMerchantQR(merchant.id);
    success(res, { qrDataURL, merchantId: merchant.id });
  }

  // POST /api/v1/shop/qr/dynamic
  async generateDynamicQR(req: AuthRequest, res: any) {
    const { amount } = req.body;
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);

    const qrDataURL = await generateDynamicQR(merchant.id, amount);
    success(res, { qrDataURL, amount, expiresInSeconds: 60 });
  }

  // GET /api/v1/shop/transactions
  async getTransactions(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const [transactions, total] = await Promise.all([
      prisma.merchantTransaction.findMany({
        where: { merchantId: merchant.id }, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { transaction: { include: { wallet: { include: { user: { select: { fullName: true, studentId: true } } } } } } },
      }),
      prisma.merchantTransaction.count({ where: { merchantId: merchant.id } }),
    ]);

    paginated(res, transactions, page, limit, total);
  }

  // GET /api/v1/shop/settlement
  async getSettlement(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);

    success(res, {
      pendingBalance: merchant.pendingBalance,
      availableBalance: merchant.availableBalance,
      dailyVolume: merchant.dailyVolume,
    });
  }

  // POST /api/v1/shop/withdrawal
  async requestWithdrawal(req: AuthRequest, res: any) {
    const { amount, destination } = req.body;
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);
    if (amount > merchant.availableBalance) return error(res, 'INSUFFICIENT_BALANCE', 'Insufficient available balance', 400);

    const ref = generateReferenceId('WDR');
    await prisma.merchant.update({ where: { id: merchant.id }, data: { availableBalance: { decrement: amount } } });

    success(res, { message: 'Withdrawal request submitted', referenceId: ref, amount });
  }

  // GET /api/v1/shop/reports
  async getReports(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant not found', 404);

    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyTx = await prisma.merchantTransaction.findMany({
      where: { merchantId: merchant.id, createdAt: { gte: last30 } },
      include: { transaction: true },
    });

    const totalRevenue = monthlyTx.reduce((sum, t) => sum + (t.settlementAmount || 0), 0);

    success(res, { totalRevenue, transactionCount: monthlyTx.length, pendingBalance: merchant.pendingBalance });
  }

  // GET /api/v1/shop/profile
  async getProfile(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user!.id } });
    if (!merchant) return error(res, 'NOT_FOUND', 'Merchant profile not found', 404);
    success(res, merchant);
  }

  // PUT /api/v1/shop/profile
  async updateProfile(req: AuthRequest, res: any) {
    const merchant = await prisma.merchant.update({
      where: { userId: req.user!.id },
      data: req.body,
    });
    success(res, merchant);
  }

  // GET /api/v1/shop/refunds
  async getRefunds(req: AuthRequest, res: any) {
    const refunds = await prisma.transaction.findMany({
      where: { type: 'REFUND', initiatedBy: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    success(res, refunds);
  }
}
