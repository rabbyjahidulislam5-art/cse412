import { getDB } from "./db";
import { uid } from "./format";
import type { OtpChallenge } from "./types";

// OTP system: generates 6-digit codes, stores them with expiry, and verifies.
// In a real app the code is emailed/SMS'd; here we expose it via API for the
// demo modal (the UI shows it in a "demo" hint).

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function issueOtp(
  userId: string,
  channel: OtpChallenge["channel"],
  purpose: OtpChallenge["purpose"],
  payload?: Record<string, unknown>
): OtpChallenge {
  const db = getDB();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const otp: OtpChallenge = {
    id: uid("otp"),
    userId,
    channel,
    purpose,
    code,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    payload,
    consumed: false,
  };
  db.otps.push(otp);
  return otp;
}

export function peekCode(id: string): string | null {
  const db = getDB();
  const otp = db.otps.find((o) => o.id === id);
  return otp ? otp.code : null;
}

export function verifyOtp(
  id: string,
  code: string
):
  | { ok: true; otp: OtpChallenge }
  | { ok: false; error: string; remaining?: number } {
  const db = getDB();
  const idx = db.otps.findIndex((o) => o.id === id);
  if (idx === -1) return { ok: false, error: "Invalid verification request." };
  const otp = db.otps[idx];
  if (otp.consumed)
    return { ok: false, error: "This code has already been used." };
  if (Date.now() > otp.expiresAt)
    return { ok: false, error: "This code has expired. Please request a new one." };
  if (otp.attempts >= MAX_ATTEMPTS) {
    otp.consumed = true;
    return {
      ok: false,
      error: "Too many incorrect attempts. Please request a new code.",
    };
  }
  if (otp.code !== code.trim()) {
    otp.attempts += 1;
    const remaining = MAX_ATTEMPTS - otp.attempts;
    db.otps[idx] = otp;
    return {
      ok: false,
      error: `Incorrect code. ${remaining} attempt${
        remaining === 1 ? "" : "s"
      } remaining.`,
      remaining,
    };
  }
  otp.consumed = true;
  db.otps[idx] = otp;
  return { ok: true, otp };
}

export function resendOtp(id: string): OtpChallenge | null {
  const db = getDB();
  const old = db.otps.find((o) => o.id === id);
  if (!old) return null;
  return issueOtp(old.userId, old.channel, old.purpose, old.payload);
}
