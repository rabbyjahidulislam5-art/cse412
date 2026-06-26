import { NextRequest } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/session";
import { getUserById } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { otpId, code } = await req.json();
    if (!otpId || !code)
      return Response.json({ error: "Code is required." }, { status: 400 });

    const res = verifyOtp(String(otpId), String(code));
    if (!res.ok)
      return Response.json({ error: res.error }, { status: 400 });

    const user = getUserById(res.otp.userId);
    if (!user) return Response.json({ error: "User not found." }, { status: 404 });

    await createSession(user.account.id);
    return Response.json({
      ok: true,
      user: {
        id: user.account.id,
        name: user.account.name,
        email: user.account.email,
      },
    });
  } catch {
    return Response.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}
