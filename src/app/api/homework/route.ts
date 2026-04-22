import { z } from "zod";
import type { OptionalId } from "mongodb";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbClass } from "@/lib/classes/types";
import type { DbHomework } from "@/lib/homework/types";
import type { DbHomeworkProgress } from "@/lib/homework/progress-types";
import { isHomeworkComplete, submittedCount, requiredSubmissionIds } from "@/lib/homework/progress-types";
import { homeworkTasksSchema } from "@/lib/homework/task-schema";
import { parseHomeworkTasksForCreate } from "@/lib/homework/parse-and-normalize-tasks";
import { publicHomeworkFields } from "@/lib/homework/serialize";

const createSchema = z
  .object({
    classId: z.string().min(1),
    title: z.string().min(1),
    instructions: z.string().max(50_000).optional().default(""),
    /** ISO-like string from `<input type="datetime-local" />` or empty for no due date */
    dueAt: z.string().max(40).optional(),
    tasks: homeworkTasksSchema.optional(),
  })
  .refine((d) => d.instructions.trim().length > 0 || (d.tasks && d.tasks.length > 0), {
    message: "Add instructions or at least one activity block",
    path: ["instructions"],
  });

function canManageClass(userId: string, role: string, row: DbClass) {
  if (role === "creator") return true;
  return row.teacherIds.includes(userId);
}

async function attachClassTitles(db: Awaited<ReturnType<typeof getDb>>, items: DbHomework[]) {
  if (items.length === 0) return [];
  const classIds = [...new Set(items.map((h) => h.classId.toHexString()))]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const classes = await db
    .collection<DbClass>("classes")
    .find({ _id: { $in: classIds } })
    .project({ title: 1 })
    .toArray();
  const titleById = new Map(classes.map((c) => [c._id.toHexString(), c.title]));
  return items.map((h) => ({
    ...publicHomeworkFields(h),
    classTitle: titleById.get(h.classId.toHexString()) ?? "Class",
  }));
}

async function withStudentProgress(
  db: Awaited<ReturnType<typeof getDb>>,
  studentId: string,
  rows: DbHomework[],
  enriched: Awaited<ReturnType<typeof attachClassTitles>>,
) {
  if (rows.length === 0) return enriched;
  const hwIds = rows.map((r) => r._id);
  const prog = await db
    .collection<DbHomeworkProgress>("homework_progress")
    .find({ studentId, homeworkId: { $in: hwIds } })
    .toArray();
  const map = new Map(prog.map((p) => [p.homeworkId.toHexString(), p]));
  return enriched.map((h, i) => {
    const row = rows[i];
    const p = map.get(h.id);
    const submitted = p?.submitted;
    const tasks = row.tasks;
    return {
      ...h,
      isComplete: isHomeworkComplete(tasks, submitted),
      submittedCount: submittedCount(tasks, submitted),
      totalRequired: requiredSubmissionIds(tasks).length,
    };
  });
}

export async function GET(req: Request) {
  const guard = await requireUser(["creator", "teacher", "student"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const classIdParam = url.searchParams.get("classId")?.trim() ?? "";

  const db = await getDb();
  const classesCol = db.collection<DbClass>("classes");
  const hwCol = db.collection<DbHomework>("homework");

  if (guard.user.role === "student") {
    if (classIdParam) {
      if (!ObjectId.isValid(classIdParam)) {
        return Response.json({ error: "Invalid classId" }, { status: 400 });
      }
      const cls = await classesCol.findOne({ _id: new ObjectId(classIdParam) });
      if (!cls || !cls.studentIds.includes(guard.user.id)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const rows = await hwCol.find({ classId: cls._id }).sort({ dueAt: 1, createdAt: -1 }).limit(200).toArray();
      const enriched = await attachClassTitles(db, rows);
      return Response.json({
        homework: await withStudentProgress(db, guard.user.id, rows, enriched),
      });
    }

    const myClasses = await classesCol
      .find({ studentIds: guard.user.id })
      .project({ _id: 1 })
      .limit(200)
      .toArray();
    const oids = myClasses.map((c) => c._id);
    if (oids.length === 0) return Response.json({ homework: [] });

    const rows = await hwCol
      .find({ classId: { $in: oids } })
      .sort({ dueAt: 1, createdAt: -1 })
      .limit(500)
      .toArray();
    const enriched = await attachClassTitles(db, rows);
    return Response.json({
      homework: await withStudentProgress(db, guard.user.id, rows, enriched),
    });
  }

  // teacher / creator
  if (classIdParam) {
    if (!ObjectId.isValid(classIdParam)) {
      return Response.json({ error: "Invalid classId" }, { status: 400 });
    }
    const cls = await classesCol.findOne({ _id: new ObjectId(classIdParam) });
    if (!cls) return Response.json({ error: "Not found" }, { status: 404 });
    if (!canManageClass(guard.user.id, guard.user.role, cls)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const rows = await hwCol.find({ classId: cls._id }).sort({ dueAt: 1, createdAt: -1 }).limit(200).toArray();
    const enriched = await attachClassTitles(db, rows);
    return Response.json({ homework: enriched });
  }

  const classQuery =
    guard.user.role === "creator" ? {} : { teacherIds: guard.user.id as string };
  const managed = await classesCol.find(classQuery).project({ _id: 1 }).limit(200).toArray();
  const oids = managed.map((c) => c._id);
  if (oids.length === 0) return Response.json({ homework: [] });

  const rows = await hwCol
    .find({ classId: { $in: oids } })
    .sort({ dueAt: 1, createdAt: -1 })
    .limit(500)
    .toArray();
  const enriched = await attachClassTitles(db, rows);
  return Response.json({ homework: enriched });
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!ObjectId.isValid(parsed.data.classId)) {
    return Response.json({ error: "Invalid classId" }, { status: 400 });
  }

  const db = await getDb();
  const classId = new ObjectId(parsed.data.classId);
  const cls = await db.collection<DbClass>("classes").findOne({ _id: classId });
  if (!cls) return Response.json({ error: "Class not found" }, { status: 404 });
  if (!canManageClass(guard.user.id, guard.user.role, cls)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasksOut = parseHomeworkTasksForCreate(parsed.data.tasks);
  if (tasksOut === null) {
    return Response.json({ error: "Invalid activity blocks", details: "tasks failed validation" }, { status: 400 });
  }

  const instructionsTrim = parsed.data.instructions.trim();
  if (instructionsTrim.length === 0 && !tasksOut?.length) {
    return Response.json(
      { error: "Add instructions or at least one valid activity block" },
      { status: 400 },
    );
  }

  const now = new Date();
  const dueRaw = parsed.data.dueAt?.trim() ?? "";
  let dueAt: Date | null = null;
  if (dueRaw.length > 0) {
    const d = new Date(dueRaw);
    if (Number.isNaN(d.getTime())) {
      return Response.json({ error: "Invalid due date" }, { status: 400 });
    }
    dueAt = d;
  }

  const doc: OptionalId<DbHomework> = {
    classId,
    title: parsed.data.title.trim(),
    instructions: instructionsTrim,
    dueAt,
    createdBy: guard.user.id,
    createdAt: now,
    updatedAt: now,
  };
  if (tasksOut?.length) doc.tasks = tasksOut;

  const result = await db.collection<OptionalId<DbHomework>>("homework").insertOne(doc);
  const created = await db.collection<DbHomework>("homework").findOne({ _id: result.insertedId });
  if (!created) return Response.json({ error: "Failed to create" }, { status: 500 });

  const [enriched] = await attachClassTitles(db, [created]);
  return Response.json({ homework: enriched }, { status: 201 });
}
