import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";

type LessonLink = { label: string; url: string };

type DbLesson = {
  _id: ObjectId;
  title: string;
  program: "ielts" | "dsat" | "general";
  body: string;
  links: LessonLink[];
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  program: z.enum(["ielts", "dsat", "general"]).optional(),
  body: z.string().min(1).optional(),
  links: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).optional(),
  studentIds: z.array(z.string().min(1)).optional(),
});

function publicLesson(l: DbLesson) {
  return {
    id: l._id.toHexString(),
    title: l.title,
    program: l.program,
    body: l.body,
    links: l.links,
    studentIds: l.studentIds,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin", "teacher", "student", "parent"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const lesson = await db.collection<DbLesson>("lessons").findOne({ _id: new ObjectId(id) });
  if (!lesson) return Response.json({ error: "Not found" }, { status: 404 });

  if (
    guard.user.role === "student" &&
    lesson.studentIds.length > 0 &&
    !lesson.studentIds.includes(guard.user.id)
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ lesson: publicLesson(lesson) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const update: Partial<Omit<DbLesson, "_id">> = { updatedAt: new Date() };
  if (parsed.data.title) update.title = parsed.data.title.trim();
  if (parsed.data.program) update.program = parsed.data.program;
  if (parsed.data.body) update.body = parsed.data.body;
  if (parsed.data.links) update.links = parsed.data.links;
  if (parsed.data.studentIds) update.studentIds = parsed.data.studentIds;

  const db = await getDb();
  const _id = new ObjectId(id);
  await db.collection<DbLesson>("lessons").updateOne({ _id }, { $set: update });
  const lesson = await db.collection<DbLesson>("lessons").findOne({ _id });
  if (!lesson) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ lesson: publicLesson(lesson) });
}

