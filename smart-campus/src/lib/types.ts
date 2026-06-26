// Domain types shared across the app

export type ID = string;

export interface SessionUser {
  id: ID;
  name: string;
  email: string;
  studentId: string;
  program: string;
  department: string;
  avatarColor: string;
  createdAt: string;
}

export interface Account extends SessionUser {
  passwordHash: string;
  phone: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  status: "active" | "locked";
}

export interface FeeLine {
  id: ID;
  label: string;
  amount: number; // BDT
  category: "tuition" | "lab" | "library" | "activity" | "other";
  dueDate: string;
  status: "unpaid" | "partial" | "paid";
}

export interface Installment {
  id: ID;
  title: string;
  amount: number;
  dueDate: string;
  status: "upcoming" | "due" | "overdue" | "paid";
  paidDate?: string;
}

export interface Fine {
  id: ID;
  type: "library" | "disciplinary" | "late-fee" | "other";
  title: string;
  description: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: "active" | "paid" | "disputed";
}

export interface LibraryBook {
  id: ID;
  title: string;
  author: string;
  borrowedDate: string;
  dueDate: string;
  renewedCount: number;
  maxRenewals: number;
  status: "borrowed" | "overdue" | "returned";
}

export interface WalletTransaction {
  id: ID;
  type: "topup" | "tuition" | "fine" | "refund" | "qr-pay";
  title: string;
  amount: number; // negative = debit, positive = credit
  method?: "bkash" | "nagad" | "wallet" | "card";
  reference: string;
  date: string;
  status: "success" | "pending" | "failed";
}

export interface Course {
  id: ID;
  code: string;
  title: string;
  credits: number;
  instructor: string;
  section: string;
  schedule: string;
  seats: number;
  seatsTaken: number;
  status: "available" | "full" | "selected" | "locked";
}

export interface AdvisingState {
  term: string;
  maxCredits: number;
  minCredits: number;
  selected: ID[];
  locked: boolean;
  lockReason?: string;
  registrationOpen: boolean;
}

export interface Receipt {
  id: ID;
  txnId: ID;
  purpose: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
}

export interface OtpChallenge {
  id: ID;
  userId: ID;
  channel: "email" | "sms";
  purpose:
    | "login"
    | "register"
    | "reset"
    | "wallet-topup"
    | "tuition-pay"
    | "fine-pay"
    | "qr-pay"
    | "email-verify";
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  payload?: Record<string, unknown>;
  consumed: boolean;
}

export interface ActiveSession {
  id: ID;
  userId: ID;
  device: string;
  browser: string;
  location: string;
  ip: string;
  current: boolean;
  lastActive: string;
}

export interface ToastMsg {
  id: ID;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}
