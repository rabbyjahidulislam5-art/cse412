import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { updateProfile } from "@/lib/ledger";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const r = updateProfile(user.id, {
      name: body.name,
      phone: body.phone,
      program: body.program,
      department: body.department,
    });
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Update failed." }, { status: 500 });
  }
}
