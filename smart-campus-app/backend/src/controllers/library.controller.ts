import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { success, error, paginated } from '../utils/response';
import { config } from '../config';

export class LibraryController {
  // GET /api/v1/library/dashboard
  async getDashboard(req: AuthRequest, res: any) {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const [issuedToday, returnedToday, overdueCount, fineCollected] = await Promise.all([
      prisma.bookIssue.count({ where: { issuedAt: { gte: today } } }),
      prisma.bookIssue.count({ where: { returnedAt: { gte: today } } }),
      prisma.bookIssue.count({ where: { returnedAt: null, dueDate: { lt: new Date() } } }),
      prisma.fine.aggregate({ where: { type: 'LIBRARY', paidAt: { gte: today } }, _sum: { accumulatedAmount: true } }),
    ]);

    const topOverdue = await prisma.bookIssue.findMany({
      where: { returnedAt: null, dueDate: { lt: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { student: { select: { fullName: true, studentId: true } }, book: { select: { title: true, isbn: true } } },
    });

    success(res, { issuedToday, returnedToday, overdueCount, fineCollectedToday: fineCollected._sum.accumulatedAmount || 0, topOverdue });
  }

  // GET /api/v1/library/books
  async getBooks(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string;

    const where: any = {};
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search } },
      { author: { contains: search, mode: 'insensitive' } },
    ];

    const [books, total] = await Promise.all([
      prisma.book.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { title: 'asc' } }),
      prisma.book.count({ where }),
    ]);

    paginated(res, books, page, limit, total);
  }

  // POST /api/v1/library/books
  async addBook(req: AuthRequest, res: any) {
    const book = await prisma.book.create({ data: req.body });
    success(res, book, 201);
  }

  // GET /api/v1/library/books/:isbn
  async getBook(req: AuthRequest, res: any) {
    const book = await prisma.book.findUnique({ where: { isbn: req.params.isbn }, include: { issues: { include: { student: true }, where: { returnedAt: null } } } });
    if (!book) return error(res, 'NOT_FOUND', 'Book not found', 404);
    success(res, book);
  }

  // POST /api/v1/library/issue
  async issueBook(req: AuthRequest, res: any) {
    const { studentId, bookId, dueDate } = req.body;

    const student = await prisma.user.findUnique({ where: { studentId } });
    if (!student) return error(res, 'NOT_FOUND', 'Student not found', 404);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableQty <= 0) return error(res, 'BOOK_UNAVAILABLE', 'Book is not available', 400);

    // Check student active issues
    const activeIssues = await prisma.bookIssue.count({ where: { studentId: student.id, returnedAt: null } });
    if (activeIssues >= 2) return error(res, 'ISSUE_LIMIT', 'Student already has 2 books issued', 400);

    const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const issueDate = dueDate ? new Date(dueDate) : defaultDueDate;

    const issue = await prisma.$transaction(async (tx) => {
      const bookIssue = await tx.bookIssue.create({
        data: { studentId: student.id, bookId, issuedBy: req.user!.id, dueDate: issueDate },
      });
      await tx.book.update({ where: { id: bookId }, data: { availableQty: { decrement: 1 } } });

      await tx.notification.create({
        data: { userId: student.id, type: 'LIBRARY', title: 'Book Issued', message: `"${book.title}" has been issued. Due by ${issueDate.toDateString()}`, channel: 'IN_APP', status: 'PENDING' },
      });

      return bookIssue;
    });

    success(res, issue, 201);
  }

  // POST /api/v1/library/return
  async returnBook(req: AuthRequest, res: any) {
    const { bookIssueId, condition } = req.body;

    const issue = await prisma.bookIssue.findUnique({ where: { id: bookIssueId }, include: { book: true, student: true } });
    if (!issue || issue.returnedAt) return error(res, 'NOT_FOUND', 'Issue not found or already returned', 404);

    const today = new Date();
    const isOverdue = today > issue.dueDate;
    const daysOverdue = isOverdue ? Math.max(0, Math.floor((today.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    // Get fine policy
    const policy = await prisma.finePolicy.findFirst({ orderBy: { updatedAt: 'desc' } });
    const dailyRate = policy?.libraryDailyRate || 500; // default 5 BDT
    const graceDays = policy?.gracePeriodDays || 0;
    const effectiveOverdue = Math.max(0, daysOverdue - graceDays);

    let fineAmount = 0;
    if (effectiveOverdue > 0) {
      fineAmount = effectiveOverdue * dailyRate;
      if (policy?.maxFineCap) fineAmount = Math.min(fineAmount, policy.maxFineCap);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.bookIssue.update({
        where: { id: bookIssueId },
        data: { returnedAt: today, returnedBy: req.user!.id, conditionOnReturn: condition || 'GOOD' },
      });
      await tx.book.update({ where: { id: issue.bookId }, data: { availableQty: { increment: 1 } } });

      let fine: any = null;
      if (fineAmount > 0) {
        fine = await tx.fine.create({
          data: {
            userId: issue.studentId, type: 'LIBRARY',
            description: `Overdue: "${issue.book.title}" - ${daysOverdue} days overdue`,
            baseAmount: fineAmount, accumulatedAmount: fineAmount,
            dailyRate, status: 'ACTIVE', createdBy: req.user!.id, bookIssueId,
          },
        });

        await tx.advisingClearance.upsert({
          where: { studentId: issue.studentId },
          create: { studentId: issue.studentId, semester: issue.student.semester || 1, blockedReason: `Unpaid library fine: ৳${fineAmount / 100}` },
          update: { clearedAt: null, blockedReason: `Unpaid library fine(s)` },
        });

        await tx.notification.create({
          data: { userId: issue.studentId, type: 'FINE', title: 'Library Fine', message: `Book returned. Fine of ৳${fineAmount / 100} posted to your account.`, channel: 'IN_APP', status: 'PENDING' },
        });
      } else {
        await tx.notification.create({
          data: { userId: issue.studentId, type: 'LIBRARY', title: 'Book Returned', message: `"${issue.book.title}" returned successfully. No fine incurred.`, channel: 'IN_APP', status: 'PENDING' },
        });
      }

      return { fine, daysOverdue, fineAmount };
    });

    success(res, { message: 'Book returned successfully', ...result });
  }

  // GET /api/v1/library/overdue
  async getOverdue(req: AuthRequest, res: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const where = { returnedAt: null as null, dueDate: { lt: new Date() as any } };
    const [overdue, total] = await Promise.all([
      prisma.bookIssue.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { dueDate: 'asc' },
        include: { student: { select: { fullName: true, studentId: true, phone: true } }, book: { select: { title: true, isbn: true } }, fine: true },
      }),
      prisma.bookIssue.count({ where }),
    ]);

    paginated(res, overdue, page, limit, total);
  }

  // POST /api/v1/library/overdue/:id/remind
  async sendOverdueReminder(req: AuthRequest, res: any) {
    const issue = await prisma.bookIssue.findUnique({ where: { id: req.params.id }, include: { student: true, book: true } });
    if (!issue) return error(res, 'NOT_FOUND', 'Issue not found', 404);

    await prisma.bookIssue.update({ where: { id: req.params.id }, data: { reminderCount: { increment: 1 }, lastReminderAt: new Date() } });

    await prisma.notification.create({
      data: { userId: issue.studentId, type: 'LIBRARY', title: 'Overdue Book Reminder', message: `"${issue.book.title}" is overdue. Please return it as soon as possible.`, channel: 'IN_APP', status: 'PENDING' },
    });

    success(res, { message: 'Reminder sent' });
  }

  // GET /api/v1/library/fines
  async getFines(req: AuthRequest, res: any) {
    const fines = await prisma.fine.findMany({ where: { type: 'LIBRARY' }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    success(res, fines);
  }

  // GET /api/v1/library/students
  async searchStudents(req: AuthRequest, res: any) {
    const search = req.query.q as string;
    if (!search) return error(res, 'BAD_REQUEST', 'Search query required', 400);

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', OR: [{ studentId: { contains: search } }, { fullName: { contains: search } }] },
      include: { wallet: true },
      take: 10,
    });
    success(res, students);
  }

  // GET /api/v1/library/reports
  async getReports(req: AuthRequest, res: any) {
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [issueCount, returnCount, overdueCount, fineCollected] = await Promise.all([
      prisma.bookIssue.count({ where: { issuedAt: { gte: last30 } } }),
      prisma.bookIssue.count({ where: { returnedAt: { gte: last30 } } }),
      prisma.bookIssue.count({ where: { returnedAt: null, dueDate: { lt: new Date() } } }),
      prisma.fine.aggregate({ where: { type: 'LIBRARY', status: 'PAID', paidAt: { gte: last30 } }, _sum: { accumulatedAmount: true } }),
    ]);

    const topBooks = await prisma.bookIssue.groupBy({
      by: ['bookId'],
      where: { issuedAt: { gte: last30 } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    success(res, { issueCount, returnCount, overdueCount, fineCollected: fineCollected._sum.accumulatedAmount || 0, topBooks });
  }
}
