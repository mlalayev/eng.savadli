import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbClass } from "@/lib/classes/types";
import { assertAllStudents, assertAllTeachersOrCreators } from "@/lib/classes/members";
import type { UserProgramCategory } from "@/lib/users/types";

const patchSchema = z
  .object({
    title: z.string().min(1).optional(),
    category: z.enum(["dsat", "ielts", "general"]).nullable().optional(),
    teacherIds: z.array(z.string().min(1)).optional(),
    studentIds: z.array(z.string().min(1)).optional(),
  })
  .refine((d) => d.title !== undefined || d.category !== undefined || d.teacherIds !== undefined || d.studentIds !== undefined, {
    message: "No changes provided",
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

async function loadClass(db: Awaited<ReturnType<typeof getDb>>, id: string) {
  if (!ObjectId.isValid(id)) return null;
  return db.collection<DbClass>("classes").findOne({ _id: new ObjectId(id) });
}

function canManage(userId: string, role: string, row: DbClass) {
  if (role === "creator") return true;
  return row.teacherIds.includes(userId);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const db = await getDb();
  const row = await loadClass(db, id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canManage(guard.user.id, guard.user.role, row)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ class: publicClass(row) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const row = await loadClass(db, id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canManage(guard.user.id, guard.user.role, row)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Partial<DbClass> = { updatedAt: new Date() };
  if (parsed.data.title) update.title = parsed.data.title.trim();
  if (parsed.data.category !== undefined) {
    update.category = parsed.data.category;
  }

  if (parsed.data.studentIds !== undefined) {
    const ok = await assertAllStudents(db, parsed.data.studentIds);
    if (!ok) return Response.json({ error: "All class members must be active students" }, { status: 400 });
    update.studentIds = Array.from(new Set(parsed.data.studentIds));
  }

  if (parsed.data.teacherIds !== undefined) {
    if (guard.user.role !== "creator") {
      return Response.json({ error: "Only creator can change teachers on a class" }, { status: 403 });
    }
    const nextTeachers = Array.from(new Set(parsed.data.teacherIds));
    if (nextTeachers.length === 0) {
      return Response.json({ error: "At least one teacher is required" }, { status: 400 });
    }
    const ok = await assertAllTeachersOrCreators(db, nextTeachers);
    if (!ok) return Response.json({ error: "All teachers must be active teacher or creator accounts" }, { status: 400 });
    update.teacherIds = nextTeachers;
  }

  const _id = new ObjectId(id);
  await db.collection<DbClass>("classes").updateOne({ _id }, { $set: update });
  const next = await db.collection<DbClass>("classes").findOne({ _id });
  if (!next) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ class: publicClass(next) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const row = await loadClass(db, id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canManage(guard.user.id, guard.user.role, row)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await db.collection<DbClass>("classes").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
