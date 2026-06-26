import { getDashboard } from "@/lib/ledger";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const dash = getDashboard(user.id);
  if (!dash) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ user, ...dash });
}
