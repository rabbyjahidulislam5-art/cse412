import { NextRequest } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { getUserById, hashPwd } from "@/lib/db";

export const runtime = "nodejs";

// Step 2 of password reset: verify the OTP and set a new password.
export async function POST(req: NextRequest) {
  try {
    const { otpId, code, password } = await req.json();
    if (!otpId || !code || !password)
      return Response.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    if (password.length < 8)
      return Response.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );

    const res = verifyOtp(String(otpId), String(code));
    if (!res.ok) return Response.json({ error: res.error }, { status: 400 });

    const user = getUserById(res.otp.userId);
    if (!user) return Response.json({ error: "User not found." }, { status: 404 });

    user.account.passwordHash = hashPwd(String(password));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Reset failed." }, { status: 500 });
  }
}
