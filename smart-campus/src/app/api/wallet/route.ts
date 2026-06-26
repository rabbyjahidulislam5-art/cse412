import { getFullUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getFullUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({
    walletBalance: user.walletBalance,
    transactions: user.transactions,
  });
}
