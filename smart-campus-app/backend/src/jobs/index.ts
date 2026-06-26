import prisma from '../config/prisma';

// JOB-01: Library Fine Accumulation (daily midnight)
export async function runFineAccumulation() {
  console.log('[JOB-01] Starting library fine accumulation...');
  const startTime = Date.now();

  const policy = await prisma.finePolicy.findFirst({ orderBy: { updatedAt: 'desc' } });
  const dailyRate = policy?.libraryDailyRate || 500; // 5 BDT default
  const gracePeriod = policy?.gracePeriodDays || 0;
  const maxCap = policy?.maxFineCap;

  const overdueIssues = await prisma.bookIssue.findMany({
    where: { returnedAt: null, dueDate: { lt: new Date() } },
    include: { fine: true, student: true, book: true },
  });

  let processed = 0;
  for (const issue of overdueIssues) {
    const daysOverdue = Math.max(0, Math.floor((Date.now() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const effectiveDays = Math.max(0, daysOverdue - gracePeriod);
    if (effectiveDays <= 0) continue;

    let fineAmount = effectiveDays * dailyRate;
    if (maxCap) fineAmount = Math.min(fineAmount, maxCap);

    if (issue.fine) {
      await prisma.fine.update({ where: { id: issue.fine.id }, data: { accumulatedAmount: fineAmount } });
    } else {
      const fine = await prisma.fine.create({
        data: {
          userId: issue.studentId, type: 'LIBRARY',
          description: `Overdue: "${issue.book.title}" - ${daysOverdue} days`,
          baseAmount: fineAmount, accumulatedAmount: fineAmount, dailyRate, status: 'ACTIVE',
          createdBy: issue.issuedBy, bookIssueId: issue.id,
        },
      });

      // Block advising
      await prisma.advisingClearance.upsert({
        where: { studentId: issue.studentId },
        create: { studentId: issue.studentId, semester: issue.student.semester || 1, blockedReason: `Unpaid library fine: ৳${fineAmount / 100}` },
        update: { clearedAt: null, blockedReason: `Unpaid library fine(s)` },
      });

      // Notify on Day 1
      await prisma.notification.create({
        data: { userId: issue.studentId, type: 'FINE', title: 'Library Fine', message: `Fine of ৳${fineAmount / 100} for overdue book "${issue.book.title}"`, channel: 'IN_APP', status: 'PENDING' },
      });
    }

    // Escalation at 30 days
    if (daysOverdue >= 30) {
      await prisma.fine.update({ where: { id: issue.fine!.id }, data: { status: 'ESCALATED' } });
    }
    // Day 7 notification
    if (daysOverdue === 7) {
      await prisma.notification.create({
        data: { userId: issue.studentId, type: 'LIBRARY', title: 'Overdue Escalation', message: `"${issue.book.title}" is 7 days overdue.`, channel: 'IN_APP', status: 'PENDING' },
      });
    }

    processed++;
  }

  console.log(`[JOB-01] Completed in ${Date.now() - startTime}ms. Processed ${processed} records.`);
}

// JOB-02: Daily Wallet Limit Reset
export async function runDailyLimitReset() {
  console.log('[JOB-02] Resetting daily wallet limits...');
  await prisma.wallet.updateMany({
    where: {},
    data: { dailyTopupUsed: 0, dailySpendUsed: 0, dailyTopupResetAt: new Date(), dailySpendResetAt: new Date() },
  });
  console.log('[JOB-02] Done.');
}

// JOB-03: Advising Clearance Check
export async function runAdvisingClearanceCheck() {
  console.log('[JOB-03] Checking advising clearances...');
  const heldStudents = await prisma.advisingClearance.findMany({
    where: { clearedAt: null },
    include: { student: true },
  });

  for (const clearance of heldStudents) {
    const activeFines = await prisma.fine.count({ where: { userId: clearance.studentId, status: { in: ['ACTIVE', 'APPEALED'] } } });
    if (activeFines === 0) {
      await prisma.advisingClearance.update({
        where: { id: clearance.id },
        data: { clearedAt: new Date(), blockedReason: null, autoCleared: true },
      });
      await prisma.notification.create({
        data: { userId: clearance.studentId, type: 'ADVISING', title: 'Advising Unlocked', message: 'All clearances met. Course advising is now available!', channel: 'IN_APP', status: 'PENDING' },
      });
    }
  }
  console.log(`[JOB-03] Done. Checked ${heldStudents.length} students.`);
}

// JOB-04: Payment Intent Expiry
export async function runPaymentIntentExpiry() {
  console.log('[JOB-04] Expiring old payment intents...');
  const result = await prisma.paymentIntent.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  console.log(`[JOB-04] Expired ${result.count} intents.`);
}

// JOB-05: Merchant Settlement
export async function runMerchantSettlement() {
  console.log('[JOB-05] Running merchant settlement...');
  const merchants = await prisma.merchant.findMany({ where: { status: 'ACTIVE', pendingBalance: { gt: 0 } } });
  for (const m of merchants) {
    await prisma.merchant.update({
      where: { id: m.id },
      data: { availableBalance: { increment: m.pendingBalance }, pendingBalance: 0 },
    });
  }
  console.log(`[JOB-05] Settled ${merchants.length} merchants.`);
}

// JOB-06: Overdue Escalation
export async function runOverdueEscalation() {
  console.log('[JOB-06] Checking overdue escalations...');
  const escalated = await prisma.bookIssue.updateMany({
    where: { returnedAt: null, dueDate: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    data: { reminderCount: { increment: 1 } },
  });
  console.log(`[JOB-06] Escalated ${escalated.count} overdue books.`);
}

// JOB-11: Session Cleanup
export async function runSessionCleanup() {
  console.log('[JOB-11] Cleaning old sessions...');
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.session.deleteMany({ where: { revokedAt: { lt: cutoff } } });
  console.log('[JOB-11] Done.');
}
