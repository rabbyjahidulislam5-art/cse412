import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { extendBook } from "@/lib/ledger";

export const runtime = "nodejs";

// Extend a library book's due date by 2 days (no OTP needed, no charge).
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { bookId, days } = await req.json();
    if (!bookId)
      return Response.json({ error: "Book id required." }, { status: 400 });
    const r = extendBook(user.id, String(bookId), Number(days) || 2);
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true, data: r.data });
  } catch {
    return Response.json({ error: "Could not extend." }, { status: 500 });
  }
}
