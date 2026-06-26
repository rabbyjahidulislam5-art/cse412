import { cookies } from "next/headers";
import { getDB, getUserById, type UserRecord } from "./db";
import type { SessionUser } from "./types";

// Encrypted cookie session using iron-session-style sealed tokens built on
// jose (JWT). Keeps the auth state server-side only.

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "ewu_session";
const SECRET =
  process.env.SESSION_SECRET ||
  "dev-insecure-secret-please-set-SESSION_SECRET-to-32+chars";

interface SessionPayload {
  uid: string;
  iat: number;
}

async function getKey(): Promise<CryptoKey> {
  const { importPKCS8 } = await import("jose");
  // Derive a key from the secret (HS256). Use a UTF-8 encoded secret as JWK.
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  // we just use raw HMAC key
  return raw as unknown as CryptoKey;
}

async function sign(payload: SessionPayload): Promise<string> {
  const { SignJWT } = await import("jose");
  const key = await getKey();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key as any);
}

async function verify(token: string): Promise<SessionPayload | null> {
  const { jwtVerify } = await import("jose");
  try {
    const key = await getKey();
    const { payload } = await jwtVerify(token, key as any);
    if (payload && typeof payload.uid === "string") {
      return { uid: payload.uid, iat: Number(payload.iat || 0) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = await sign({ uid: userId, iat: Date.now() });
  const store = cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  // touch session record
  const u = getUserById(userId);
  if (u) {
    const cur = u.sessions.find((s) => s.current);
    if (cur) cur.lastActive = new Date().toISOString();
  }
}

export async function destroySession(): Promise<void> {
  const store = cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verify(token);
  if (!payload) return null;
  const rec = getUserById(payload.uid);
  if (!rec) return null;
  const a = rec.account;
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    studentId: a.studentId,
    program: a.program,
    department: a.department,
    avatarColor: a.avatarColor,
    createdAt: a.createdAt,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) {
    throw new Error("UNAUTHORIZED");
  }
  return u;
}

export async function getFullUser(): Promise<UserRecord | null> {
  const su = await getSessionUser();
  if (!su) return null;
  return getUserById(su.id) || null;
}

// Helper for API routes to return 401 consistently
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export const SESSION_COOKIE = COOKIE_NAME;
