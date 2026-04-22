import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbUser } from "@/lib/auth";

export async function GET() {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const db = await getDb();
  const rows = await db
    .collection<DbUser>("users")
    .find({ role: "student", status: "active" })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();

  return Response.json({
    students: rows.map((u) => ({ id: u._id.toHexString(), name: u.name, email: u.email })),
  });
}

