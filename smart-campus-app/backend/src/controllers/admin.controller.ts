import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { success, error, paginated } from '../utils/response';

export class AdminController {
  // GET /api/v1/admin/dashboard
  async getDashboard(req: AuthRequest, res: any) {
    const [totalStudents, activeWallets, todayTxVolume, pendingKYC, openTickets, recentAlerts] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
      prisma.wallet.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { amount: true }, _count: true }),
      prisma.user.count({ where: { kycStatus: { in: ['PENDING', 'SUBMITTED'] } } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.securityEvent.findMany({ orderBy: { timestamp: 'desc' }, take: 10 }),
    ]);

    success(res, {
      totalStudents, activeWallets,
      todayTxVolume: todayTxVolume._sum.amount || 0,
      todayTxCount: todayTxVolume._count,
      pendingKYC, openTickets, recentAlerts,
    });
  }

  // GET /api/v1/admin/students
  async getStudents(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const department = req.query.department as string;

    const where: any = { role: 'STUDENT', deletedAt: null };
    if (search) where.OR = [
      { studentId: { contains: search } },
      { fullName: { contains: search } },
      { email: { contains: search } },
    ];
    if (status) where.status = status;
    if (department) where.department = department;

    const [students, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    paginated(res, students, page, limit, total);
  }

  // GET /api/v1/admin/students/:id
  async getStudentDetail(req: AuthRequest, res: any) {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { wallet: true, fines: true, kycDocuments: true, transactions: { take: 20 } },
    });
    if (!user) return error(res, 'NOT_FOUND', 'Student not found', 404);
    success(res, user);
  }

  // GET /api/v1/admin/kyc/queue
  async getKYCQueue(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const where = { kycStatus: { in: ['PENDING', 'SUBMITTED'] } as any };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'asc' },
        include: { kycDocuments: true },
      }),
      prisma.user.count({ where }),
    ]);

    paginated(res, users, page, limit, total);
  }

  // PUT /api/v1/admin/kyc/:id/decision
  async kycDecision(req: AuthRequest, res: any) {
    const userId = req.params.id;
    const { decision, rejectionReason, notes } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return error(res, 'NOT_FOUND', 'User not found', 404);

    if (decision === 'APPROVED') {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { status: 'ACTIVE', kycStatus: 'APPROVED' } });
        await tx.kycDocument.updateMany({ where: { userId }, data: { status: 'APPROVED', reviewedBy: req.user!.id, reviewedAt: new Date() } });
        await tx.wallet.create({ data: { userId, status: 'ACTIVE' } });
      });

      await prisma.notification.create({
        data: { userId, type: 'AUTH', title: 'KYC Approved', message: 'Your identity verification has been approved. Welcome to Smart Campus!', channel: 'IN_APP', status: 'PENDING' },
      });
    } else {
      await prisma.user.update({ where: { id: userId }, data: { kycStatus: 'REJECTED', status: 'KYC_PENDING' } });
      await prisma.kycDocument.updateMany({ where: { userId }, data: { status: 'REJECTED', reviewedBy: req.user!.id, reviewedAt: new Date(), rejectionReason } });
    }

    await prisma.auditLog.create({ data: { userId: req.user!.id, action: `KYC_${decision}`, entityType: 'User', entityId: userId, newValue: { decision, notes } } });
    success(res, { message: `KYC ${decision.toLowerCase()}` });
  }

  // GET /api/v1/admin/transactions
  async getTransactions(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const flagged = req.query.flagged === 'true';

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (flagged) where.flagged = true;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { wallet: { include: { user: true } } } }),
      prisma.transaction.count({ where }),
    ]);

    paginated(res, transactions, page, limit, total);
  }

  // POST /api/v1/admin/fines
  async addFine(req: AuthRequest, res: any) {
    const { studentId, type, description, amount, dueDate, notes } = req.body;
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return error(res, 'NOT_FOUND', 'Student not found', 404);

    const fine = await prisma.fine.create({
      data: { userId: user.id, type, description, baseAmount: amount, accumulatedAmount: amount, createdBy: req.user!.id },
    });

    await prisma.fine.update({ where: { id: fine.id }, data: { status: 'ACTIVE' } });

    // Block advising if fine is created
    await prisma.advisingClearance.upsert({
      where: { studentId: user.id },
      create: { studentId: user.id, semester: user.semester || 1, blockedReason: `${type} fine: ৳${amount / 100}` },
      update: { clearedAt: null, blockedReason: `Unpaid ${type} fine(s)`, unblockedAt: null },
    });

    await prisma.notification.create({
      data: { userId: user.id, type: 'FINE', title: 'New Fine Added', message: `A ${type.toLowerCase()} fine of ৳${amount / 100} has been added. ${description}`, channel: 'IN_APP', status: 'PENDING' },
    });

    success(res, fine, 201);
  }

  // GET /api/v1/admin/fines
  async getAllFines(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const [fines, total] = await Promise.all([
      prisma.fine.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: true } }),
      prisma.fine.count(),
    ]);

    paginated(res, fines, page, limit, total);
  }

  // POST /api/v1/admin/fines/:id/waive
  async waiveFine(req: AuthRequest, res: any) {
    const { reason, notes } = req.body;
    await prisma.fine.update({
      where: { id: req.params.id },
      data: { status: 'WAIVED', waivedAt: new Date(), waiverReason: reason },
    });
    success(res, { message: 'Fine waived' });
  }

  // POST /api/v1/admin/students/:id/suspend
  async suspendStudent(req: AuthRequest, res: any) {
    const { reason, duration } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return error(res, 'NOT_FOUND', 'Student not found', 404);

    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
    await prisma.wallet.updateMany({ where: { userId: req.params.id }, data: { status: 'SUSPENDED' } });

    const { revokeAllSessions } = await import('../middleware/auth.middleware');
    await revokeAllSessions(req.params.id);

    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'SUSPEND_STUDENT', entityType: 'User', entityId: req.params.id, newValue: { reason, duration } } });
    await prisma.notification.create({ data: { userId: req.params.id, type: 'SECURITY', title: 'Account Suspended', message: `Your account has been suspended. Reason: ${reason}`, channel: 'IN_APP', status: 'PENDING' } });

    success(res, { message: 'Student suspended' });
  }

  // GET /api/v1/admin/wallets
  async getWallets(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: true } }),
      prisma.wallet.count(),
    ]);
    paginated(res, wallets, page, limit, total);
  }

  // GET /api/v1/admin/audit
  async getAuditLogs(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { timestamp: 'desc' } }),
      prisma.auditLog.count(),
    ]);
    paginated(res, logs, page, limit, total);
  }

  // GET /api/v1/admin/security
  async getSecurityEvents(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { timestamp: 'desc' }, include: { user: true } }),
      prisma.securityEvent.count(),
    ]);
    paginated(res, events, page, limit, total);
  }

  // GET /api/v1/admin/support
  async getSupportTickets(req: AuthRequest, res: any) {
    const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true } });
    success(res, tickets);
  }

  // POST /api/v1/admin/notifications/broadcast
  async broadcastNotification(req: AuthRequest, res: any) {
    const { target, targetValue, title, message, channels } = req.body;
    const where: any = { role: 'STUDENT', status: 'ACTIVE' };
    if (target === 'DEPARTMENT') where.department = targetValue;
    if (target === 'INDIVIDUAL') where.id = targetValue;

    const users = await prisma.user.findMany({ where, select: { id: true } });
    const created = await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, type: 'SYSTEM', title, message, channel: 'IN_APP', status: 'PENDING' })),
    });

    success(res, { sent: created.count });
  }

  // GET /api/v1/admin/reports/financial
  async getFinancialReport(req: AuthRequest, res: any) {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const [transactions, fineTotals, merchantTotals] = await Promise.all([
      prisma.transaction.groupBy({ by: ['type'], where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
      prisma.fine.aggregate({ where: { createdAt: { gte: startDate, lte: endDate } }, _sum: { accumulatedAmount: true }, _count: true }),
      prisma.merchant.aggregate({ where: { status: 'ACTIVE' }, _sum: { pendingBalance: true, availableBalance: true }, _count: true }),
    ]);

    success(res, { transactions, fineTotals, merchantTotals, period: { start: startDate, end: endDate } });
  }

  // POST /api/v1/admin/transaction/:id/override
  async overrideTransaction(req: AuthRequest, res: any) {
    const { action, reason } = req.body;
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx) return error(res, 'NOT_FOUND', 'Transaction not found', 404);

    await prisma.transaction.update({ where: { id: tx.id }, data: { flagged: action === 'flag', flagReason: reason } });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: `TX_OVERRIDE_${action.toUpperCase()}`, entityType: 'Transaction', entityId: tx.id, newValue: { reason } } });
    success(res, { message: 'Transaction override applied' });
  }
}
