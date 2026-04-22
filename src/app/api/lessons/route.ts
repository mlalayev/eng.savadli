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
  studentIds: string[]; // empty = visible to all students
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const createSchema = z.object({
  title: z.string().min(1),
  program: z.enum(["ielts", "dsat", "general"]),
  body: z.string().min(1),
  links: z
    .array(z.object({ label: z.string().min(1), url: z.string().url() }))
    .optional()
    .default([]),
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

export async function GET() {
  const guard = await requireUser(["creator", "admin", "teacher", "student", "parent"]);
  if (!guard.ok) return guard.response;

  const db = await getDb();
  const q: Record<string, unknown> =
    guard.user.role === "student"
      ? { $or: [{ studentIds: { $size: 0 } }, { studentIds: guard.user.id }] }
      : {};

  const lessons = await db
    .collection<DbLesson>("lessons")
    .find(q)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  return Response.json({ lessons: lessons.map(publicLesson) });
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const doc: Omit<DbLesson, "_id"> = {
    title: parsed.data.title.trim(),
    program: parsed.data.program,
    body: parsed.data.body,
    links: parsed.data.links ?? [],
    studentIds: [],
    createdBy: guard.user.id,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  const result = await db.collection<Omit<DbLesson, "_id">>("lessons").insertOne(doc);
  return Response.json({ id: result.insertedId.toHexString() }, { status: 201 });
}

