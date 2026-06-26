import { getFullUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getFullUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({
    account: {
      id: user.account.id,
      name: user.account.name,
      email: user.account.email,
      studentId: user.account.studentId,
      program: user.account.program,
      department: user.account.department,
      phone: user.account.phone,
      avatarColor: user.account.avatarColor,
      twoFactorEnabled: user.account.twoFactorEnabled,
      emailVerified: user.account.emailVerified,
      createdAt: user.account.createdAt,
    },
    sessions: user.sessions,
  });
}
