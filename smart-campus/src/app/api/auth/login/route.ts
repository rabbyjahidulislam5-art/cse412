import { NextRequest } from "next/server";
import { getUserByEmail, verifyPwd } from "@/lib/db";
import { createSession } from "@/lib/session";
import { issueOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, remember } = body || {};
    if (!email || !password)
      return Response.json({ error: "Email and password are required." }, { status: 400 });

    const user = getUserByEmail(String(email));
    if (!user || !verifyPwd(String(password), user.account.passwordHash)) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    if (user.account.status === "locked")
      return Response.json(
        { error: "Account is locked. Please contact the registrar." },
        { status: 403 }
      );

    // If 2FA is enabled, return an OTP challenge instead of logging in.
    if (user.account.twoFactorEnabled) {
      const otp = issueOtp(user.account.id, "email", "login");
      return Response.json({
        requiresOtp: true,
        otpId: otp.id,
        channel: otp.channel,
        message: `A 6-digit code was sent to ${user.account.email}.`,
        // demo convenience: expose the code so the dev can complete login
        demoCode: otp.code,
      });
    }

    await createSession(user.account.id);
    return Response.json({
      ok: true,
      user: {
        id: user.account.id,
        name: user.account.name,
        email: user.account.email,
      },
      remember: !!remember,
    });
  } catch (e) {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
