import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { issueOtp } from "@/lib/otp";
import type { OtpChallenge } from "@/lib/types";

export const runtime = "nodejs";

// Creates an OTP challenge for a sensitive action. The actual mutation
// payload is stored on the challenge and executed only after verification.
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { purpose, payload } = body || {};
    const allowed: OtpChallenge["purpose"][] = [
      "wallet-topup",
      "tuition-pay",
      "fine-pay",
      "qr-pay",
    ];
    if (!allowed.includes(purpose))
      return Response.json({ error: "Invalid purpose." }, { status: 400 });

    const otp = issueOtp(user.id, "email", purpose, payload);
    return Response.json({
      ok: true,
      otpId: otp.id,
      message: `Enter the 6-digit code sent to your registered email.`,
      demoCode: otp.code,
    });
  } catch {
    return Response.json({ error: "Could not create challenge." }, { status: 500 });
  }
}
