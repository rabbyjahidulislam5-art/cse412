import { NextRequest } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db";
import { issueOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const {
      name,
      email,
      studentId,
      password,
      program,
      department,
      phone,
    } = b || {};

    if (!name || !email || !studentId || !password)
      return Response.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    if (password.length < 8)
      return Response.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    if (getUserByEmail(String(email)))
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );

    const created = createUser({
      name,
      email,
      studentId,
      password,
      program: program || "Undergraduate",
      department: department || "Department of CSE",
      phone: phone || "",
    });
    if (!created.ok)
      return Response.json({ error: created.error }, { status: 409 });

    const otp = issueOtp(
      created.user.account.id,
      "email",
      "register"
    );
    return Response.json({
      ok: true,
      otpId: otp.id,
      message: `We sent a 6-digit code to ${created.user.account.email}.`,
      demoCode: otp.code,
    });
  } catch {
    return Response.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
