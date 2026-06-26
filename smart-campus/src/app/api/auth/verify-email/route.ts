import { NextRequest } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { getUserById } from "@/lib/db";

export const runtime = "nodejs";

// Used after registration: verifies email-OTP and marks the account verified.
export async function POST(req: NextRequest) {
  try {
    const { otpId, code } = await req.json();
    if (!otpId || !code)
      return Response.json({ error: "Code is required." }, { status: 400 });

    const res = verifyOtp(String(otpId), String(code));
    if (!res.ok)
      return Response.json({ error: res.error }, { status: 400 });

    const user = getUserById(res.otp.userId);
    if (user) user.account.emailVerified = true;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Verification failed." }, { status: 500 });
  }
}
