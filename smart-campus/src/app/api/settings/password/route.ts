import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { changePassword } from "@/lib/ledger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { current, next } = await req.json();
    const r = changePassword(user.id, String(current || ""), String(next || ""));
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Password change failed." }, { status: 500 });
  }
}
