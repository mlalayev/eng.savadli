import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbUser } from "@/lib/auth";
import { publicUser } from "@/lib/users/public";

const schema = z.object({
  ids: z.array(z.string().min(1)).max(100),
});

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const ids = [...new Set(parsed.data.ids)];
  const objectIds = ids.filter((x) => ObjectId.isValid(x)).map((x) => new ObjectId(x));
  if (objectIds.length !== ids.length) {
    return Response.json({ error: "Invalid user id in list" }, { status: 400 });
  }

  const db = await getDb();
  const rows = await db
    .collection<DbUser>("users")
    .find({
      _id: { $in: objectIds },
      role: "student",
      status: "active",
    })
    .limit(100)
    .toArray();

  return Response.json({ users: rows.map(publicUser) });
}
