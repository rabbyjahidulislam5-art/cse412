import { NextRequest } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { issueOtp } from "@/lib/otp";

export const runtime = "nodejs";

// Step 1 of password reset: issue an OTP if the email exists (we always
// return a generic message to prevent email enumeration).
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email)
      return Response.json({ error: "Email is required." }, { status: 400 });

    const user = getUserByEmail(String(email));
    if (user) {
      const otp = issueOtp(user.account.id, "email", "reset");
      return Response.json({
        ok: true,
        otpId: otp.id,
        message: `If an account exists for ${email}, a reset code has been sent.`,
        demoCode: otp.code,
      });
    }
    return Response.json({
      ok: true,
      message: `If an account exists for ${email}, a reset code has been sent.`,
    });
  } catch {
    return Response.json({ error: "Request failed." }, { status: 500 });
  }
}
