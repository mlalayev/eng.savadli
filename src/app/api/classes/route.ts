import { z } from "zod";
import type { OptionalId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import { assertAllStudents, assertAllTeachersOrCreators } from "@/lib/classes/members";
import type { DbClass } from "@/lib/classes/types";
import type { UserProgramCategory } from "@/lib/users/types";

const createSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["dsat", "ielts", "general"]).optional(),
  teacherIds: z.array(z.string().min(1)).optional(),
  studentIds: z.array(z.string().min(1)).optional(),
});

function publicClass(c: DbClass) {
  return {
    id: c._id.toHexString(),
    title: c.title,
    category: (c.category ?? null) as UserProgramCategory | null,
    teacherIds: c.teacherIds,
    studentIds: c.studentIds,
    createdBy: c.createdBy,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET() {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const db = await getDb();
  const col = db.collection<DbClass>("classes");

  const q =
    guard.user.role === "creator"
      ? {}
      : {
          teacherIds: guard.user.id,
        };

  const rows = await col.find(q).sort({ updatedAt: -1 }).limit(200).toArray();
  return Response.json({ classes: rows.map(publicClass) });
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  let teacherIds: string[] = [];
  if (guard.user.role === "teacher") {
    teacherIds = [guard.user.id];
  } else {
    const fromBody = parsed.data.teacherIds?.length ? Array.from(new Set(parsed.data.teacherIds)) : [];
    teacherIds = fromBody.length ? fromBody : [guard.user.id];
  }

  const studentIds = parsed.data.studentIds?.length ? Array.from(new Set(parsed.data.studentIds)) : [];

  const db = await getDb();
  const teachersOk = await assertAllTeachersOrCreators(db, teacherIds);
  if (!teachersOk) {
    return Response.json({ error: "Each class needs at least one valid teacher or creator account" }, { status: 400 });
  }
  const studentsOk = await assertAllStudents(db, studentIds);
  if (!studentsOk) {
    return Response.json({ error: "Students must be active student accounts" }, { status: 400 });
  }

  const doc: OptionalId<DbClass> = {
    title: parsed.data.title.trim(),
    category: parsed.data.category ?? null,
    teacherIds,
    studentIds,
    createdBy: guard.user.id,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<OptionalId<DbClass>>("classes").insertOne(doc);
  const created = await db.collection<DbClass>("classes").findOne({ _id: result.insertedId });
  return Response.json({ class: created ? publicClass(created) : null }, { status: 201 });
}
