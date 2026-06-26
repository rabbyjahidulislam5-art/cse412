import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { revokeSession, setTwoFactor } from "@/lib/ledger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    if (body.action === "revoke-session") {
      const r = revokeSession(user.id, String(body.sessionId));
      if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
      return Response.json({ ok: true });
    }
    if (body.action === "toggle-2fa") {
      const r = setTwoFactor(user.id, !!body.enabled);
      if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
      return Response.json({ ok: true, enabled: !!body.enabled });
    }
    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch {
    return Response.json({ error: "Security update failed." }, { status: 500 });
  }
}
