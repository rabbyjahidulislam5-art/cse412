import {
  Account,
  ActiveSession,
  AdvisingState,
  Course,
  Fine,
  Installment,
  LibraryBook,
  OtpChallenge,
  Receipt,
  WalletTransaction,
} from "./types";
import { uid } from "./format";

// ---------------------------------------------------------------------------
// In-memory data store. Persists for the lifetime of the server process.
// All mutations go through this module so state stays consistent across
// API routes and Server Components.
// ---------------------------------------------------------------------------

export interface UserRecord {
  account: Account;
  walletBalance: number;
  fees: import("./types").FeeLine[];
  installments: Installment[];
  fines: Fine[];
  books: LibraryBook[];
  transactions: WalletTransaction[];
  advising: AdvisingState;
  courses: Course[];
  receipts: Receipt[];
  sessions: ActiveSession[];
}

export interface DB {
  users: Map<string, UserRecord>; // keyed by user id
  emailIndex: Map<string, string>; // email -> userId
  studentIdIndex: Map<string, string>; // studentId -> userId
  otps: OtpChallenge[];
  version: number;
}

const globalForDb = globalThis as unknown as { __EWU_DB?: DB };

// Shared course catalog template. Each user gets a fresh deep copy so their
// selections / status changes never bleed into another user's record.
function courseCatalog(): import("./types").Course[] {
  return [
    {
      id: "cse401",
      code: "CSE 401",
      title: "Software Engineering",
      credits: 3,
      instructor: "Dr. Nadia Karim",
      section: "A",
      schedule: "Sun/Tue 09:00–10:30",
      seats: 45,
      seatsTaken: 30,
      status: "available",
    },
    {
      id: "cse405",
      code: "CSE 405",
      title: "Database Management Systems",
      credits: 3,
      instructor: "Prof. Tanvir Ahmed",
      section: "B",
      schedule: "Sat/Mon 11:00–12:30",
      seats: 50,
      seatsTaken: 50,
      status: "full",
    },
    {
      id: "cse411",
      code: "CSE 411",
      title: "Computer Networks",
      credits: 3,
      instructor: "Dr. Imran Kabir",
      section: "A",
      schedule: "Sun/Wed 14:00–15:30",
      seats: 40,
      seatsTaken: 22,
      status: "available",
    },
    {
      id: "cse421",
      code: "CSE 421",
      title: "Artificial Intelligence",
      credits: 3,
      instructor: "Dr. Sadia Rahman",
      section: "A",
      schedule: "Tue/Thu 10:00–11:30",
      seats: 40,
      seatsTaken: 35,
      status: "available",
    },
    {
      id: "cse431",
      code: "CSE 431",
      title: "Theory of Computation",
      credits: 3,
      instructor: "Prof. Mahmud Hasan",
      section: "A",
      schedule: "Sat/Wed 08:00–09:30",
      seats: 35,
      seatsTaken: 12,
      status: "available",
    },
    {
      id: "hum401",
      code: "HUM 401",
      title: "Professional Ethics",
      credits: 2,
      instructor: "Dr. Farzana Islam",
      section: "A",
      schedule: "Mon 16:00–18:00",
      seats: 60,
      seatsTaken: 18,
      status: "available",
    },
    {
      id: "cse498",
      code: "CSE 498",
      title: "Capstone Project I",
      credits: 3,
      instructor: "Dr. Nadia Karim",
      section: "A",
      schedule: "Thu 15:00–18:00",
      seats: 30,
      seatsTaken: 28,
      status: "available",
    },
  ];
}

function seed(): DB {
  const db: DB = {
    users: new Map(),
    emailIndex: new Map(),
    studentIdIndex: new Map(),
    otps: [],
    version: 1,
  };

  // Demo account (password: "demo1234")
  const demoId = "usr_demo";
  const demo: UserRecord = {
    account: {
      id: demoId,
      name: "Arif Hossain",
      email: "demo@ewubd.edu",
      studentId: "2021-1-60-012",
      program: "B.Sc. in Computer Science & Engineering",
      department: "Department of CSE",
      avatarColor: "#3366ff",
      createdAt: "2021-09-01T00:00:00.000Z",
      passwordHash: hashPwd("demo1234"),
      phone: "+8801712345678",
      emailVerified: true,
      twoFactorEnabled: true,
      status: "active",
    },
    walletBalance: 8450.5,
    fees: [
      {
        id: uid("fee"),
        label: "Tuition Fee — Summer 2026 (12 credits)",
        amount: 52800,
        category: "tuition",
        dueDate: "2026-06-30",
        status: "unpaid",
      },
      {
        id: uid("fee"),
        label: "Laboratory Fee",
        amount: 3500,
        category: "lab",
        dueDate: "2026-06-30",
        status: "unpaid",
      },
      {
        id: uid("fee"),
        label: "Student Activity Fee",
        amount: 1500,
        category: "activity",
        dueDate: "2026-06-15",
        status: "partial",
      },
      {
        id: uid("fee"),
        label: "Library Membership — Spring 2026",
        amount: 1200,
        category: "library",
        dueDate: "2026-02-10",
        status: "paid",
      },
    ],
    installments: [
      {
        id: uid("ins"),
        title: "1st Installment (40%)",
        amount: 23000,
        dueDate: "2026-06-10",
        status: "paid",
        paidDate: "2026-06-08",
      },
      {
        id: uid("ins"),
        title: "2nd Installment (30%)",
        amount: 17250,
        dueDate: "2026-07-05",
        status: "due",
      },
      {
        id: uid("ins"),
        title: "3rd Installment (30%)",
        amount: 17550,
        dueDate: "2026-08-05",
        status: "upcoming",
      },
    ],
    fines: [
      {
        id: "fine_lib1",
        type: "library",
        title: "Overdue Book — Clean Code",
        description:
          "Book returned 5 days past the due date. ৳50/day late fee applies.",
        amount: 250,
        issuedDate: "2026-06-18",
        dueDate: "2026-06-25",
        status: "active",
      },
      {
        id: "fine_lib2",
        type: "library",
        title: "Overdue Book — Designing Data-Intensive Apps",
        description: "Book is currently overdue. Pay fine or extend due date.",
        amount: 400,
        issuedDate: "2026-06-20",
        dueDate: "2026-06-27",
        status: "active",
      },
      {
        id: uid("fine"),
        type: "late-fee",
        title: "Late Registration Fee",
        description: "Advising completed after the regular window.",
        amount: 500,
        issuedDate: "2026-06-12",
        dueDate: "2026-07-12",
        status: "active",
      },
    ],
    books: [
      {
        id: "bk1",
        title: "Clean Code",
        author: "Robert C. Martin",
        borrowedDate: "2026-05-28",
        dueDate: "2026-06-18",
        renewedCount: 0,
        maxRenewals: 2,
        status: "overdue",
      },
      {
        id: "bk2",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        borrowedDate: "2026-06-01",
        dueDate: "2026-06-22",
        renewedCount: 1,
        maxRenewals: 2,
        status: "overdue",
      },
      {
        id: "bk3",
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt",
        borrowedDate: "2026-06-10",
        dueDate: "2026-07-01",
        renewedCount: 0,
        maxRenewals: 2,
        status: "borrowed",
      },
    ],
    transactions: [
      {
        id: uid("txn"),
        type: "topup",
        title: "Wallet Top-up via bKash",
        amount: 5000,
        method: "bkash",
        reference: "BKX9921",
        date: "2026-06-19T10:24:00.000Z",
        status: "success",
      },
      {
        id: uid("txn"),
        type: "tuition",
        title: "1st Installment — Summer 2026",
        amount: -23000,
        method: "wallet",
        reference: "EWU-INS-001",
        date: "2026-06-08T14:02:00.000Z",
        status: "success",
      },
      {
        id: uid("txn"),
        type: "topup",
        title: "Wallet Top-up via Nagad",
        amount: 3000,
        method: "nagad",
        reference: "NGD5582",
        date: "2026-06-07T09:11:00.000Z",
        status: "success",
      },
      {
        id: uid("txn"),
        type: "qr-pay",
        title: "QR Pay — Campus Café",
        amount: -320,
        method: "wallet",
        reference: "QR-CAFE-7741",
        date: "2026-06-06T13:40:00.000Z",
        status: "success",
      },
      {
        id: uid("txn"),
        type: "refund",
        title: "Library Overcharge Refund",
        amount: 120,
        method: "wallet",
        reference: "RFD-2026-09",
        date: "2026-06-02T16:20:00.000Z",
        status: "success",
      },
    ],
    advising: {
      term: "Summer 2026",
      maxCredits: 15,
      minCredits: 9,
      selected: [],
      locked: false,
      registrationOpen: true,
    },
    courses: courseCatalog(),
    receipts: [
      {
        id: uid("rcpt"),
        txnId: "rcpt_seed_1",
        purpose: "1st Installment — Summer 2026",
        amount: 23000,
        date: "2026-06-08T14:02:00.000Z",
        method: "Wallet",
        reference: "EWU-INS-001",
      },
      {
        id: uid("rcpt"),
        txnId: "rcpt_seed_2",
        purpose: "Library Membership — Spring 2026",
        amount: 1200,
        date: "2026-02-10T11:30:00.000Z",
        method: "bKash",
        reference: "BKX3340",
      },
    ],
    sessions: [
      {
        id: uid("sess"),
        userId: demoId,
        device: "Windows PC",
        browser: "Chrome",
        location: "Dhaka, Bangladesh",
        ip: "103.•••.•••.42",
        current: true,
        lastActive: new Date().toISOString(),
      },
      {
        id: uid("sess"),
        userId: demoId,
        device: "iPhone 13",
        browser: "Safari",
        location: "Dhaka, Bangladesh",
        ip: "103.•••.•••.18",
        current: false,
        lastActive: "2026-06-20T18:42:00.000Z",
      },
    ],
  };

  db.users.set(demoId, demo);
  db.emailIndex.set(demo.account.email.toLowerCase(), demoId);
  db.studentIdIndex.set(demo.account.studentId, demoId);

  return db;
}

export function getDB(): DB {
  if (!globalForDb.__EWU_DB) {
    globalForDb.__EWU_DB = seed();
  }
  return globalForDb.__EWU_DB;
}

// ---- password hashing (synchronous, bcryptjs-free fallback) ---------------
// We try bcryptjs first; if unavailable we fall back to a salted SHA hash so
// the app still runs without `npm install`. In production use a real KDF.
export function hashPwd(plain: string): string {
  try {
    const bcrypt = require("bcryptjs");
    return bcrypt.hashSync(plain, 10);
  } catch {
    const salt = "ewu_static_salt_v1";
    const crypto = require("crypto");
    const h = crypto.createHash("sha256").update(salt + ":" + plain).digest("hex");
    return `sha256$${h}`;
  }
}

export function verifyPwd(plain: string, hash: string): boolean {
  if (hash.startsWith("$2")) {
    try {
      const bcrypt = require("bcryptjs");
      return bcrypt.compareSync(plain, hash);
    } catch {
      return false;
    }
  }
  if (hash.startsWith("sha256$")) {
    return hashPwd(plain) === hash;
  }
  return false;
}

// ---- user helpers ----------------------------------------------------------
export function getUserByEmail(email: string): UserRecord | undefined {
  const db = getDB();
  const id = db.emailIndex.get(email.toLowerCase().trim());
  return id ? db.users.get(id) : undefined;
}

export function getUserById(id: string): UserRecord | undefined {
  return getDB().users.get(id);
}

export function getUserByStudentId(sid: string): UserRecord | undefined {
  const db = getDB();
  const id = db.studentIdIndex.get(sid.trim());
  return id ? db.users.get(id) : undefined;
}

export function createUser(input: {
  name: string;
  email: string;
  studentId: string;
  password: string;
  program: string;
  department: string;
  phone: string;
}): { ok: true; user: UserRecord } | { ok: false; error: string } {
  const db = getDB();
  const email = input.email.toLowerCase().trim();
  if (db.emailIndex.has(email))
    return { ok: false, error: "An account with this email already exists." };
  if (db.studentIdIndex.has(input.studentId.trim()))
    return {
      ok: false,
      error: "This Student ID is already registered.",
    };

  const id = uid("usr");
  const colors = ["#3366ff", "#16a34a", "#d97706", "#9333ea", "#dc2626"];
  const user: UserRecord = {
    account: {
      id,
      name: input.name.trim(),
      email,
      studentId: input.studentId.trim(),
      program: input.program.trim(),
      department: input.department.trim(),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString(),
      passwordHash: hashPwd(input.password),
      phone: input.phone.trim(),
      emailVerified: false,
      twoFactorEnabled: false,
      status: "active",
    },
    walletBalance: 0,
    fees: [],
    installments: [],
    fines: [],
    books: [],
    transactions: [],
    advising: {
      term: "Summer 2026",
      maxCredits: 15,
      minCredits: 9,
      selected: [],
      locked: false,
      registrationOpen: true,
    },
    courses: courseCatalog(),
    receipts: [],
    sessions: [],
  };
  db.users.set(id, user);
  db.emailIndex.set(email, id);
  db.studentIdIndex.set(input.studentId.trim(), id);
  return { ok: true, user };
}
