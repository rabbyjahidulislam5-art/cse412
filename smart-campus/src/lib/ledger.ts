import { getDB, getUserById, verifyPwd, hashPwd, type UserRecord } from "./db";
import { uid } from "./format";
import type {
  Fine,
  Receipt,
  WalletTransaction,
} from "./types";

// ---------------------------------------------------------------------------
// Central ledger: every money movement goes through here so balances, fees,
// installments, fines and transactions stay consistent. Returns plain values
// so they can be JSON-serialised across API boundaries.
// ---------------------------------------------------------------------------

function addTxn(
  user: UserRecord,
  input: Omit<WalletTransaction, "id" | "date" | "status"> &
    Partial<Pick<WalletTransaction, "status">>
): WalletTransaction {
  const txn: WalletTransaction = {
    id: uid("txn"),
    date: new Date().toISOString(),
    status: input.status ?? "success",
    ...input,
  };
  user.transactions.unshift(txn);
  return txn;
}

function addReceipt(
  user: UserRecord,
  input: Omit<Receipt, "id" | "date"> & { date?: string }
): Receipt {
  const r: Receipt = {
    id: uid("rcpt"),
    date: input.date || new Date().toISOString(),
    ...input,
  };
  user.receipts.unshift(r);
  return r;
}

export interface Result<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

// ---- Wallet top-up --------------------------------------------------------
export function topUpWallet(
  userId: string,
  amount: number,
  method: "bkash" | "nagad" | "card"
): Result<{ balance: number; txn: WalletTransaction }> {
  if (amount <= 0) return { ok: false, error: "Amount must be greater than 0." };
  if (amount > 50000)
    return { ok: false, error: "Maximum top-up is ৳50,000 per transaction." };
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };

  user.walletBalance += amount;
  const txn = addTxn(user, {
    type: "topup",
    title: `Wallet Top-up via ${method.toUpperCase()}`,
    amount,
    method,
    reference: `${method.toUpperCase().slice(0, 2)}X${Math.floor(
      1000 + Math.random() * 9000
    )}`,
  });
  addReceipt(user, {
    txnId: txn.id,
    purpose: "Wallet Top-up",
    amount,
    method: method.toUpperCase(),
    reference: txn.reference,
  });
  getDB().version++;
  return { ok: true, data: { balance: user.walletBalance, txn } };
}

// ---- Pay tuition / installment / fee -------------------------------------
export function payTuition(
  userId: string,
  feeId: string,
  useWallet: boolean
): Result<{ balance: number; txn: WalletTransaction }> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  const fee = user.fees.find((f) => f.id === feeId);
  if (!fee) return { ok: false, error: "Fee not found." };
  if (fee.status === "paid") return { ok: false, error: "This fee is already paid." };

  const amount = fee.amount;
  if (useWallet) {
    if (user.walletBalance < amount)
      return { ok: false, error: "Insufficient wallet balance." };
    user.walletBalance -= amount;
  }
  fee.status = "paid";

  const txn = addTxn(user, {
    type: "tuition",
    title: fee.label,
    amount: -amount,
    method: useWallet ? "wallet" : "card",
    reference: `EWU-FEE-${Math.floor(1000 + Math.random() * 9000)}`,
  });
  addReceipt(user, {
    txnId: txn.id,
    purpose: fee.label,
    amount,
    method: useWallet ? "Wallet" : "Card",
    reference: txn.reference,
  });
  getDB().version++;
  return { ok: true, data: { balance: user.walletBalance, txn } };
}

export function payInstallment(
  userId: string,
  installmentId: string,
  useWallet: boolean
): Result<{ balance: number; txn: WalletTransaction }> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  const ins = user.installments.find((i) => i.id === installmentId);
  if (!ins) return { ok: false, error: "Installment not found." };
  if (ins.status === "paid") return { ok: false, error: "Already paid." };

  const amount = ins.amount;
  if (useWallet && user.walletBalance < amount)
    return { ok: false, error: "Insufficient wallet balance." };
  if (useWallet) user.walletBalance -= amount;

  ins.status = "paid";
  ins.paidDate = new Date().toISOString();

  const txn = addTxn(user, {
    type: "tuition",
    title: ins.title,
    amount: -amount,
    method: useWallet ? "wallet" : "card",
    reference: `EWU-INS-${Math.floor(1000 + Math.random() * 9000)}`,
  });
  addReceipt(user, {
    txnId: txn.id,
    purpose: ins.title,
    amount,
    method: useWallet ? "Wallet" : "Card",
    reference: txn.reference,
  });
  getDB().version++;
  return { ok: true, data: { balance: user.walletBalance, txn } };
}

// ---- Fines ----------------------------------------------------------------
export function payFine(
  userId: string,
  fineId: string,
  useWallet: boolean
): Result<{ balance: number; txn: WalletTransaction }> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  const fine = user.fines.find((f) => f.id === fineId) as Fine | undefined;
  if (!fine) return { ok: false, error: "Fine not found." };
  if (fine.status === "paid") return { ok: false, error: "Fine already paid." };

  const amount = fine.amount;
  if (useWallet && user.walletBalance < amount)
    return { ok: false, error: "Insufficient wallet balance." };
  if (useWallet) user.walletBalance -= amount;

  fine.status = "paid";

  const txn = addTxn(user, {
    type: "fine",
    title: `Fine Paid — ${fine.title}`,
    amount: -amount,
    method: useWallet ? "wallet" : "card",
    reference: `EWU-FN-${Math.floor(1000 + Math.random() * 9000)}`,
  });
  addReceipt(user, {
    txnId: txn.id,
    purpose: `Fine — ${fine.title}`,
    amount,
    method: useWallet ? "Wallet" : "Card",
    reference: txn.reference,
  });
  // Clear fine lock on advising if no active fines remain
  const activeFines = user.fines.filter((f) => f.status === "active");
  if (activeFines.length === 0 && user.advising.lockReason === "pending-fines") {
    user.advising.locked = false;
    user.advising.lockReason = undefined;
  }
  getDB().version++;
  return { ok: true, data: { balance: user.walletBalance, txn } };
}

export function disputeFine(
  userId: string,
  fineId: string,
  reason: string
): Result<Fine> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  const fine = user.fines.find((f) => f.id === fineId);
  if (!fine) return { ok: false, error: "Fine not found." };
  if (!reason.trim()) return { ok: false, error: "Please provide a reason." };
  fine.status = "disputed";
  fine.description += ` [Dispute: ${reason.trim()}]`;
  getDB().version++;
  return { ok: true, data: fine };
}

// ---- Library: Extend 2 days ----------------------------------------------
export function extendBook(
  userId: string,
  bookId: string,
  days = 2
): Result<{ dueDate: string; renewedCount: number }> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  const book = user.books.find((b) => b.id === bookId);
  if (!book) return { ok: false, error: "Book not found." };
  if (book.status === "returned")
    return { ok: false, error: "This book has already been returned." };
  if (book.renewedCount >= book.maxRenewals)
    return {
      ok: false,
      error: `Maximum renewals (${book.maxRenewals}) reached for this book.`,
    };

  const base = new Date(book.dueDate);
  base.setDate(base.getDate() + days);
  book.dueDate = base.toISOString().slice(0, 10);
  book.renewedCount += 1;
  book.status = "borrowed";

  // Recompute the linked library fine amount if still active
  const linkedFine = user.fines.find(
    (f) =>
      f.type === "library" && f.status === "active" && f.title.includes(book.title)
  );
  if (linkedFine) {
    // overdue fine is 50/day; extending reduces remaining overdue by extending window
    linkedFine.amount = Math.max(0, linkedFine.amount - days * 50);
    if (linkedFine.amount === 0) linkedFine.status = "paid";
  }

  getDB().version++;
  return { ok: true, data: { dueDate: book.dueDate, renewedCount: book.renewedCount } };
}

// ---- QR Pay ----------------------------------------------------------------
export function qrPay(
  userId: string,
  amount: number,
  merchant: string
): Result<{ balance: number; txn: WalletTransaction }> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (amount <= 0) return { ok: false, error: "Amount must be greater than 0." };
  if (user.walletBalance < amount)
    return { ok: false, error: "Insufficient wallet balance." };
  user.walletBalance -= amount;
  const txn = addTxn(user, {
    type: "qr-pay",
    title: `QR Pay — ${merchant}`,
    amount: -amount,
    method: "wallet",
    reference: `QR-${merchant.toUpperCase().slice(0, 4)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`,
  });
  getDB().version++;
  return { ok: true, data: { balance: user.walletBalance, txn } };
}

// ---- Advising --------------------------------------------------------------
// Live lock state: advising is locked if the explicit flag is set OR there are
// any active (unpaid) fines. This keeps the lock consistent even if fines are
// added/removed without touching the advising record directly.
export function advisingIsLocked(user: UserRecord): boolean {
  if (user.advising.locked) return true;
  return user.fines.some((f) => f.status === "active");
}

export function toggleCourse(
  userId: string,
  courseId: string
): Result<{ selected: string[]; totalCredits: number }> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (advisingIsLocked(user))
    return { ok: false, error: "Advising is locked. Resolve pending fines." };

  const course = user.courses.find((c) => c.id === courseId);
  if (!course) return { ok: false, error: "Course not found." };
  if (course.status === "full")
    return { ok: false, error: "This section is full." };

  const selectedSet = new Set(user.advising.selected);
  if (selectedSet.has(courseId)) {
    selectedSet.delete(courseId);
    course.status = "available";
  } else {
    const totalCredits =
      user.advising.selected.reduce((s, id) => {
        const c = user.courses.find((x) => x.id === id);
        return s + (c?.credits || 0);
      }, 0) + course.credits;
    if (totalCredits > user.advising.maxCredits)
      return {
        ok: false,
        error: `Exceeds maximum ${user.advising.maxCredits} credits.`,
      };
    selectedSet.add(courseId);
    course.status = "selected";
  }
  user.advising.selected = Array.from(selectedSet);
  getDB().version++;
  const totalCredits = user.advising.selected.reduce((s, id) => {
    const c = user.courses.find((x) => x.id === id);
    return s + (c?.credits || 0);
  }, 0);
  return { ok: true, data: { selected: user.advising.selected, totalCredits } };
}

export function finalizeAdvising(userId: string): Result<{
  term: string;
  totalCredits: number;
  courses: string[];
}> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (advisingIsLocked(user))
    return { ok: false, error: "Advising is locked. Resolve pending fines." };
  if (user.advising.selected.length === 0)
    return { ok: false, error: "Select at least one course." };
  const totalCredits = user.advising.selected.reduce((s, id) => {
    const c = user.courses.find((x) => x.id === id);
    return s + (c?.credits || 0);
  }, 0);
  if (totalCredits < user.advising.minCredits)
    return {
      ok: false,
      error: `Minimum ${user.advising.minCredits} credits required.`,
    };
  getDB().version++;
  return {
    ok: true,
    data: {
      term: user.advising.term,
      totalCredits,
      courses: user.advising.selected,
    },
  };
}

// ---- Profile / settings ----------------------------------------------------
export function updateProfile(
  userId: string,
  patch: { name?: string; phone?: string; program?: string; department?: string }
): Result<UserRecord> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (patch.name !== undefined) user.account.name = patch.name.trim();
  if (patch.phone !== undefined) user.account.phone = patch.phone.trim();
  if (patch.program !== undefined) user.account.program = patch.program.trim();
  if (patch.department !== undefined)
    user.account.department = patch.department.trim();
  getDB().version++;
  return { ok: true, data: user };
}

export function changePassword(
  userId: string,
  current: string,
  next: string
): Result<null> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (!verifyPwd(current, user.account.passwordHash))
    return { ok: false, error: "Current password is incorrect." };
  if (next.length < 8)
    return { ok: false, error: "New password must be at least 8 characters." };
  user.account.passwordHash = hashPwd(next);
  getDB().version++;
  return { ok: true };
}

export function revokeSession(
  userId: string,
  sessionId: string
): Result<null> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  user.sessions = user.sessions.filter(
    (s) => s.id !== sessionId || s.current
  );
  getDB().version++;
  return { ok: true };
}

export function setTwoFactor(userId: string, enabled: boolean): Result<null> {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "User not found." };
  user.account.twoFactorEnabled = enabled;
  getDB().version++;
  return { ok: true };
}

// ---- Aggregations for dashboard -------------------------------------------
export function getDashboard(userId: string) {
  const user = getUserById(userId);
  if (!user) return null;
  const outstandingDues = user.fees
    .filter((f) => f.status !== "paid")
    .reduce((s, f) => s + f.amount, 0);
  const activeFines = user.fines.filter((f) => f.status === "active");
  const finesTotal = activeFines.reduce((s, f) => s + f.amount, 0);
  const advisingCredits = user.advising.selected.reduce((s, id) => {
    const c = user.courses.find((x) => x.id === id);
    return s + (c?.credits || 0);
  }, 0);

  // advising is locked if there are active fines
  const advisingLocked =
    user.advising.locked || activeFines.length > 0;

  return {
    walletBalance: user.walletBalance,
    outstandingDues,
    activeFines: activeFines.length,
    finesTotal,
    advisingCredits,
    advisingMax: user.advising.maxCredits,
    advisingMin: user.advising.minCredits,
    advisingLocked,
    lockReason: advisingLocked ? "pending-fines" : undefined,
    term: user.advising.term,
    upcomingInstallment: user.installments.find((i) => i.status !== "paid"),
    recentTxns: user.transactions.slice(0, 5),
    overdueBooks: user.books.filter((b) => b.status === "overdue").length,
  };
}
