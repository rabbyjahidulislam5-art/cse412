import { NextRequest } from "next/server";
import { resendOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { otpId } = await req.json();
    if (!otpId)
      return Response.json({ error: "Missing OTP id." }, { status: 400 });
    const otp = resendOtp(String(otpId));
    if (!otp)
      return Response.json({ error: "Could not resend code." }, { status: 404 });
    return Response.json({
      ok: true,
      otpId: otp.id,
      message: "A new code has been sent.",
      demoCode: otp.code,
    });
  } catch {
    return Response.json({ error: "Resend failed." }, { status: 500 });
  }
}
