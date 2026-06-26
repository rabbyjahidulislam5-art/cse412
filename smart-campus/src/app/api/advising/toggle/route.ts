import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { toggleCourse } from "@/lib/ledger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { courseId } = await req.json();
    if (!courseId)
      return Response.json({ error: "Course id required." }, { status: 400 });
    const r = toggleCourse(user.id, String(courseId));
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    return Response.json({ ok: true, data: r.data });
  } catch {
    return Response.json({ error: "Could not update selection." }, { status: 500 });
  }
}
