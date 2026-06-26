import { getFullUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getFullUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const totalCredits = user.advising.selected.reduce((s, id) => {
    const c = user.courses.find((x) => x.id === id);
    return s + (c?.credits || 0);
  }, 0);
  return Response.json({
    advising: user.advising,
    courses: user.courses,
    selected: user.advising.selected,
    totalCredits,
    activeFines: user.fines.filter((f) => f.status === "active").length,
  });
}
