import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { disputeFine } from "@/lib/ledger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { fineId, reason } = await req.json();
    const r = disputeFine(user.id, String(fineId), String(reason || ""));
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true, data: r.data });
  } catch {
    return Response.json({ error: "Could not dispute." }, { status: 500 });
  }
}
