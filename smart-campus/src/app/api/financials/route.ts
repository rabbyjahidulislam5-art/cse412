import { getFullUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getFullUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    fees: user.fees,
    installments: user.installments,
    transactions: user.transactions,
    receipts: user.receipts,
    walletBalance: user.walletBalance,
  });
}
