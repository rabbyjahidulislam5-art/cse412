// Run scheduled jobs - for use with node-cron in production
// This file registers all cron jobs

import cron from 'node-cron';
import {
  runFineAccumulation,
  runDailyLimitReset,
  runAdvisingClearanceCheck,
  runPaymentIntentExpiry,
  runMerchantSettlement,
  runOverdueEscalation,
  runSessionCleanup,
} from './index';

export function startScheduledJobs() {
  // JOB-01: Library Fine Accumulation (daily midnight)
  cron.schedule('0 0 * * *', () => { runFineAccumulation().catch(console.error); });
  console.log('[Cron] JOB-01: Library Fine Accumulation - scheduled daily midnight');

  // JOB-02: Daily Wallet Limit Reset (daily midnight)
  cron.schedule('0 0 * * *', () => { runDailyLimitReset().catch(console.error); });
  console.log('[Cron] JOB-02: Daily Limit Reset - scheduled daily midnight');

  // JOB-03: Advising Clearance Check (daily 1 AM)
  cron.schedule('0 1 * * *', () => { runAdvisingClearanceCheck().catch(console.error); });
  console.log('[Cron] JOB-03: Advising Clearance - scheduled daily 1 AM');

  // JOB-04: Payment Intent Expiry (every 5 min)
  cron.schedule('*/5 * * * *', () => { runPaymentIntentExpiry().catch(console.error); });
  console.log('[Cron] JOB-04: Payment Intent Expiry - scheduled every 5 min');

  // JOB-05: Merchant Settlement (daily 11 PM)
  cron.schedule('0 23 * * *', () => { runMerchantSettlement().catch(console.error); });
  console.log('[Cron] JOB-05: Merchant Settlement - scheduled daily 11 PM');

  // JOB-06: Overdue Escalation (daily 2 AM)
  cron.schedule('0 2 * * *', () => { runOverdueEscalation().catch(console.error); });
  console.log('[Cron] JOB-06: Overdue Escalation - scheduled daily 2 AM');

  // JOB-11: Session Cleanup (daily 3 AM)
  cron.schedule('0 3 * * *', () => { runSessionCleanup().catch(console.error); });
  console.log('[Cron] JOB-11: Session Cleanup - scheduled daily 3 AM');
}

// Allow manual run via CLI: ts-node src/jobs/runner.ts [jobName]
const jobName = process.argv[2];
if (jobName) {
  const jobs: Record<string, () => Promise<void>> = {
    fines: runFineAccumulation,
    limits: runDailyLimitReset,
    advising: runAdvisingClearanceCheck,
    expiry: runPaymentIntentExpiry,
    settlement: runMerchantSettlement,
    escalation: runOverdueEscalation,
    cleanup: runSessionCleanup,
  };

  if (jobs[jobName]) {
    jobs[jobName]().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
  } else {
    console.error(`Unknown job: ${jobName}. Available: ${Object.keys(jobs).join(', ')}`);
    process.exit(1);
  }
}
