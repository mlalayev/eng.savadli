import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbClass } from "@/lib/classes/types";
import type { DbHomework } from "@/lib/homework/types";
import type { DbHomeworkProgress } from "@/lib/homework/progress-types";
import { homeworkTasksSchema } from "@/lib/homework/task-schema";
import { parseHomeworkTasksForPatch } from "@/lib/homework/parse-and-normalize-tasks";
import { submissionFromProgressDoc } from "@/lib/homework/progress-serialize";
import { publicHomeworkFields } from "@/lib/homework/serialize";

const patchSchema = z
  .object({
    title: z.string().min(1).optional(),
    instructions: z.string().min(1).max(50_000).optional(),
    dueAt: z.string().max(40).nullable().optional(),
    tasks: homeworkTasksSchema.optional(),
  })
  .refine(
    (d) =>
      d.title !== undefined ||
      d.instructions !== undefined ||
      d.dueAt !== undefined ||
      d.tasks !== undefined,
    { message: "No changes provided" },
  );

function canManageClass(userId: string, role: string, row: DbClass) {
  if (role === "creator") return true;
  return row.teacherIds.includes(userId);
}

async function loadHomeworkWithClass(db: Awaited<ReturnType<typeof getDb>>, id: string) {
  if (!ObjectId.isValid(id)) return { homework: null as DbHomework | null, cls: null as DbClass | null };
  const homework = await db.collection<DbHomework>("homework").findOne({ _id: new ObjectId(id) });
  if (!homework) return { homework: null, cls: null };
  const cls = await db.collection<DbClass>("classes").findOne({ _id: homework.classId });
  return { homework, cls };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "teacher", "student"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const db = await getDb();
  const { homework, cls } = await loadHomeworkWithClass(db, id);
  if (!homework || !cls) return Response.json({ error: "Not found" }, { status: 404 });

  if (guard.user.role === "student") {
    if (!cls.studentIds.includes(guard.user.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const progress = await db
      .collection<DbHomeworkProgress>("homework_progress")
      .findOne({ homeworkId: homework._id, studentId: guard.user.id });
    const submission = submissionFromProgressDoc(progress);
    return Response.json({
      homework: {
        ...publicHomeworkFields(homework),
        classTitle: cls.title,
        submission,
      },
    });
  }

  if (!canManageClass(guard.user.id, guard.user.role, cls)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({
    homework: {
      ...publicHomeworkFields(homework),
      classTitle: cls.title,
    },
  });
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
  const { homework, cls } = await loadHomeworkWithClass(db, id);
  if (!homework || !cls) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canManageClass(guard.user.id, guard.user.role, cls)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const setDoc: Record<string, unknown> = { updatedAt: new Date() };
  const unsetDoc: Record<string, string> = {};

  if (parsed.data.title !== undefined) setDoc.title = parsed.data.title.trim();
  if (parsed.data.instructions !== undefined) setDoc.instructions = parsed.data.instructions.trim();
  if (parsed.data.dueAt !== undefined) {
    if (parsed.data.dueAt === null) {
      setDoc.dueAt = null;
    } else if (parsed.data.dueAt.trim() === "") {
      setDoc.dueAt = null;
    } else {
      const d = new Date(parsed.data.dueAt);
      if (Number.isNaN(d.getTime())) {
        return Response.json({ error: "Invalid due date" }, { status: 400 });
      }
      setDoc.dueAt = d;
    }
  }

  if (parsed.data.tasks !== undefined) {
    const nextTasks = parseHomeworkTasksForPatch(parsed.data.tasks);
    if (nextTasks === null) {
      return Response.json({ error: "Invalid activity blocks" }, { status: 400 });
    }
    if (nextTasks.length === 0) unsetDoc.tasks = "";
    else setDoc.tasks = nextTasks;
  }

  const _id = new ObjectId(id);
  const updatePayload: Record<string, unknown> = { $set: setDoc };
  if (Object.keys(unsetDoc).length > 0) updatePayload.$unset = unsetDoc;

  await db.collection<DbHomework>("homework").updateOne({ _id }, updatePayload as never);
  const next = await db.collection<DbHomework>("homework").findOne({ _id });
  if (!next) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    homework: {
      ...publicHomeworkFields(next),
      classTitle: cls.title,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const { homework, cls } = await loadHomeworkWithClass(db, id);
  if (!homework || !cls) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canManageClass(guard.user.id, guard.user.role, cls)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await db.collection<DbHomework>("homework").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
