import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { success, error } from '../utils/response';

export class StudentController {
  // GET /api/v1/student/profile
  async getProfile(req: AuthRequest, res: any) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, studentId: true, email: true, phone: true, fullName: true, role: true, department: true, semester: true, profilePhoto: true, totpEnabled: true, kycStatus: true, createdAt: true },
    });
    if (!user) return error(res, 'NOT_FOUND', 'User not found', 404);

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    const activeFines = await prisma.fine.count({ where: { userId: req.user!.id, status: 'ACTIVE' } });
    const totalFines = await prisma.fine.aggregate({ where: { userId: req.user!.id, status: 'ACTIVE' }, _sum: { accumulatedAmount: true } });
    const clearance = await prisma.advisingClearance.findUnique({ where: { studentId: req.user!.id } });

    success(res, {
      ...user,
      wallet: wallet ? { balance: wallet.balance, status: wallet.status } : null,
      activeFineCount: activeFines,
      totalFinesDue: totalFines._sum.accumulatedAmount || 0,
      advisingStatus: clearance?.clearedAt ? 'CLEAR' : clearance?.blockedReason ? 'HOLD' : 'NOT_CHECKED',
    });
  }

  // GET /api/v1/student/dashboard
  async getDashboard(req: AuthRequest, res: any) {
    const userId = req.user!.id;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const recentTx = await prisma.transaction.findMany({
      where: { walletId: wallet!.id }, take: 5, orderBy: { createdAt: 'desc' },
    });
    const activeFines = await prisma.fine.findMany({ where: { userId, status: 'ACTIVE' }, take: 10 });
    const clearance = await prisma.advisingClearance.findUnique({ where: { studentId: userId } });
    const unreadNotifs = await prisma.notification.count({ where: { userId, status: { in: ['PENDING', 'SENT'] } } });
    const totalFinesDue = activeFines.reduce((sum, f) => sum + f.accumulatedAmount, 0);

    success(res, {
      wallet: wallet ? { balance: wallet.balance, pendingBalance: wallet.pendingBalance, status: wallet.status } : null,
      recentTransactions: recentTx,
      activeFines,
      totalFinesDue,
      advisingStatus: clearance?.clearedAt ? 'CLEAR' : clearance?.blockedReason ? 'HOLD' : 'NOT_CHECKED',
      blockedReason: clearance?.blockedReason || null,
      unreadNotifications: unreadNotifs,
    });
  }

  // PUT /api/v1/student/profile
  async updateProfile(req: AuthRequest, res: any) {
    const { fullName, department, semester, profilePhoto } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { fullName, department, semester, profilePhoto },
    });
    success(res, user);
  }

  // GET /api/v1/student/notifications
  async getNotifications(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';

    const where: any = { userId: req.user!.id };
    if (unreadOnly) where.status = { in: ['PENDING', 'SENT'] };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);

    success(res, notifications, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  // PUT /api/v1/student/notifications/read-all
  async markAllRead(req: AuthRequest, res: any) {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, status: { in: ['PENDING', 'SENT'] } },
      data: { status: 'READ', readAt: new Date() },
    });
    success(res, { message: 'All notifications marked as read' });
  }

  // GET /api/v1/student/security/activity
  async getActivityLog(req: AuthRequest, res: any) {
    const events = await prisma.securityEvent.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: 'desc' }, take: 50,
    });
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id, revokedAt: null },
      orderBy: { lastUsedAt: 'desc' },
    });
    success(res, { events, sessions });
  }

  // POST /api/v1/student/security/revoke-session
  async revokeSession(req: AuthRequest, res: any) {
    await prisma.session.update({
      where: { id: req.body.sessionId },
      data: { revokedAt: new Date() },
    });
    success(res, { message: 'Session revoked' });
  }

  // POST /api/v1/student/change-password
  async changePassword(req: AuthRequest, res: any) {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return error(res, 'NOT_FOUND', 'User not found', 404);

    const valid = await (await import('../utils/crypto')).comparePassword(currentPassword, user.passwordHash);
    if (!valid) return error(res, 'INVALID_PASSWORD', 'Current password is incorrect', 400);

    const passwordHash = await (await import('../utils/crypto')).hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.securityEvent.create({ data: { userId: user.id, eventType: 'PASSWORD_CHANGE', severity: 'HIGH' } });
    success(res, { message: 'Password changed successfully' });
  }

  // POST /api/v1/student/support/ticket
  async createSupportTicket(req: AuthRequest, res: any) {
    const ticket = await prisma.supportTicket.create({
      data: { userId: req.user!.id, ...req.body },
    });
    success(res, ticket, 201);
  }

  // GET /api/v1/student/support/tickets
  async getSupportTickets(req: AuthRequest, res: any) {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    success(res, tickets);
  }
}
