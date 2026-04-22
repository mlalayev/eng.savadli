import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbClass } from "@/lib/classes/types";
import type { DbHomework } from "@/lib/homework/types";
import type { DbHomeworkProgress } from "@/lib/homework/progress-types";
import { HOMEWORK_META_TASK_ID } from "@/lib/homework/progress-types";
import { validateTaskPayload } from "@/lib/homework/validate-task-payload";
import { submissionFromProgressDoc } from "@/lib/homework/progress-serialize";
import { publicHomeworkFields } from "@/lib/homework/serialize";

const postSchema = z.object({
  taskId: z.string().min(1).max(120),
  payload: z.unknown(),
});

async function loadHomeworkWithClass(db: Awaited<ReturnType<typeof getDb>>, id: string) {
  if (!ObjectId.isValid(id)) return { homework: null as DbHomework | null, cls: null as DbClass | null };
  const homework = await db.collection<DbHomework>("homework").findOne({ _id: new ObjectId(id) });
  if (!homework) return { homework: null, cls: null };
  const cls = await db.collection<DbClass>("classes").findOne({ _id: homework.classId });
  return { homework, cls };
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["student"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const { homework, cls } = await loadHomeworkWithClass(db, id);
  if (!homework || !cls) return Response.json({ error: "Not found" }, { status: 404 });
  if (!cls.studentIds.includes(guard.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = homework.tasks ?? [];
  const taskId = parsed.data.taskId;

  let task: import("@/lib/homework/types").HomeworkTask | null = null;
  if (taskId === HOMEWORK_META_TASK_ID) {
    if (tasks.length > 0) {
      return Response.json({ error: "Invalid task for this homework" }, { status: 400 });
    }
  } else {
    task = tasks.find((t) => t.id === taskId) ?? null;
    if (!task) return Response.json({ error: "Unknown task" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = validateTaskPayload(taskId, task, parsed.data.payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid submission";
    return Response.json({ error: message }, { status: 400 });
  }

  const homeworkId = homework._id;
  const studentId = guard.user.id;
  const now = new Date();
  const col = db.collection<DbHomeworkProgress>("homework_progress");

  const existing = await col.findOne({ homeworkId, studentId });
  const submitted = { ...(existing?.submitted ?? {}), [taskId]: { at: now, payload } };
  const doc: DbHomeworkProgress = {
    _id: existing?._id ?? new ObjectId(),
    homeworkId,
    studentId,
    submitted,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await col.replaceOne({ homeworkId, studentId }, doc, { upsert: true });

  const next = await col.findOne({ homeworkId, studentId });
  if (!next) return Response.json({ error: "Failed to save" }, { status: 500 });

  const submission = submissionFromProgressDoc(next);

  return Response.json({
    ok: true,
    homework: {
      ...publicHomeworkFields(homework),
      classTitle: cls.title,
      submission,
    },
  });
}
