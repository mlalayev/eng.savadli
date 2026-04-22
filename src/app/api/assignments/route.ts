import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";

type DbAssignment = {
  _id: ObjectId;
  kind: "exam";
  examId: ObjectId;
  title: string;
  dueAt: Date | null;
  studentIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type DbExamLite = {
  _id: ObjectId;
  title: string;
  program: string;
  mode: string;
  active?: boolean;
  deletedAt?: Date | null;
  questions?: unknown;
};

const createAssignmentSchema = z.object({
  examId: z.string().min(1),
  title: z.string().min(1),
  dueAt: z.string().datetime().optional(),
  studentIds: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  const guard = await requireUser(["creator", "admin", "teacher", "student", "parent"]);
  if (!guard.ok) return guard.response;

  const db = await getDb();
  const q =
    guard.user.role === "student"
      ? { studentIds: guard.user.id }
      : {};

  const assignments = await db
    .collection<DbAssignment>("assignments")
    .find(q)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const examIds = Array.from(new Set(assignments.map((a) => a.examId.toHexString()))).filter(Boolean);
  const exams = examIds.length
    ? await db
        .collection<DbExamLite>("exams")
        .find({ _id: { $in: examIds.map((id) => new ObjectId(id)) } })
        .toArray()
    : [];
  const examById = new Map(exams.map((e) => [e._id.toHexString(), e]));

  return Response.json({
    assignments: assignments.map((a) => {
      const exam = examById.get(a.examId.toHexString());
      return {
        id: a._id.toHexString(),
        kind: a.kind,
        title: a.title,
        dueAt: a.dueAt ? a.dueAt.toISOString() : null,
        exam: exam
          ? {
              id: exam._id.toHexString(),
              title: exam.title,
              program: exam.program,
              mode: exam.mode,
              questionsCount: Array.isArray(exam.questions) ? exam.questions.length : 0,
            }
          : null,
        createdAt: a.createdAt.toISOString(),
      };
    }),
  });
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!ObjectId.isValid(parsed.data.examId)) {
    return Response.json({ error: "Invalid examId" }, { status: 400 });
  }

  const db = await getDb();
  const examId = new ObjectId(parsed.data.examId);
  const exam = await db
    .collection<DbExamLite>("exams")
    .findOne({ _id: examId, active: true, deletedAt: null });
  if (!exam) {
    return Response.json({ error: "Exam not found or inactive" }, { status: 404 });
  }

  const now = new Date();
  const doc: Omit<DbAssignment, "_id"> = {
    kind: "exam",
    examId,
    title: parsed.data.title.trim(),
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    studentIds: Array.from(new Set(parsed.data.studentIds)),
    createdBy: guard.user.id,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<Omit<DbAssignment, "_id">>("assignments").insertOne(doc);
  return Response.json({ id: result.insertedId.toHexString() }, { status: 201 });
}

