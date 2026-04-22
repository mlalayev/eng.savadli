import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { ExamMode, ExamProgram, ExamQuestion, ExamStructure } from "@/lib/exams/types";

type DbExam = {
  _id: ObjectId;
  title: string;
  program: ExamProgram;
  mode: ExamMode;
  active: boolean;
  deletedAt: Date | null;
  questions: ExamQuestion[];
  structure?: ExamStructure;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const createExamSchema = z.object({
  title: z.string().min(1),
  program: z.enum(["ielts", "dsat", "general"]),
  mode: z.enum(["full", "drill"]),
  structure: z.any().optional(),
});

function publicExam(row: DbExam) {
  return {
    id: row._id.toHexString(),
    title: row.title,
    program: row.program,
    mode: row.mode,
    active: row.active,
    questionsCount: row.questions.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const db = await getDb();
  const exams = await db
    .collection<DbExam>("exams")
    .find({ deletedAt: null })
    .sort({ updatedAt: -1 })
    .limit(500)
    .toArray();

  return Response.json({ exams: exams.map(publicExam) });
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createExamSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const doc: Omit<DbExam, "_id"> = {
    title: parsed.data.title.trim(),
    program: parsed.data.program,
    mode: parsed.data.mode,
    active: true,
    deletedAt: null,
    questions: [],
    structure: parsed.data.structure as ExamStructure | undefined,
    createdBy: guard.user.id,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  const result = await db.collection<Omit<DbExam, "_id">>("exams").insertOne(doc);

  return Response.json({ id: result.insertedId.toHexString() }, { status: 201 });
}

