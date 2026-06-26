import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { finalizeAdvising } from "@/lib/ledger";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const r = finalizeAdvising(user.id);
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true, data: r.data });
  } catch {
    return Response.json({ error: "Could not finalize." }, { status: 500 });
  }
}
