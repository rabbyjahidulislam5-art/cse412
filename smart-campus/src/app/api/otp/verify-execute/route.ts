import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { verifyOtp } from "@/lib/otp";
import {
  payTuition,
  payInstallment,
  payFine,
  qrPay,
  topUpWallet,
} from "@/lib/ledger";

export const runtime = "nodejs";

// Verifies an OTP challenge AND executes the bound action atomically.
// This is the single chokepoint through which all financial mutations flow
// after the OTP has been verified.
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { otpId, code } = await req.json();
    if (!otpId || !code)
      return Response.json({ error: "Code is required." }, { status: 400 });

    const res = verifyOtp(String(otpId), String(code));
    if (!res.ok) return Response.json({ error: res.error }, { status: 400 });

    const p = res.otp.purpose;
    const payload = (res.otp.payload || {}) as Record<string, any>;

    switch (p) {
      case "wallet-topup": {
        const r = topUpWallet(
          user.id,
          Number(payload.amount),
          payload.method || "bkash"
        );
        if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
        return Response.json({
          ok: true,
          action: "wallet-topup",
          balance: r.data!.balance,
          txn: r.data!.txn,
        });
      }
      case "tuition-pay": {
        const r =
          payload.kind === "installment"
            ? payInstallment(user.id, String(payload.id), payload.useWallet)
            : payTuition(user.id, String(payload.id), payload.useWallet);
        if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
        return Response.json({
          ok: true,
          action: "tuition-pay",
          balance: r.data!.balance,
          txn: r.data!.txn,
        });
      }
      case "fine-pay": {
        const r = payFine(user.id, String(payload.id), payload.useWallet);
        if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
        return Response.json({
          ok: true,
          action: "fine-pay",
          balance: r.data!.balance,
          txn: r.data!.txn,
        });
      }
      case "qr-pay": {
        const r = qrPay(user.id, Number(payload.amount), String(payload.merchant));
        if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
        return Response.json({
          ok: true,
          action: "qr-pay",
          balance: r.data!.balance,
          txn: r.data!.txn,
        });
      }
      default:
        return Response.json({ error: "Unsupported action." }, { status: 400 });
    }
  } catch {
    return Response.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}
