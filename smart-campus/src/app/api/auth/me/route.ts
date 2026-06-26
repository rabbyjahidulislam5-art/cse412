import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ user: null }, { status: 200 });
  return Response.json({ user });
}
