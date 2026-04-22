import { ObjectId, type OptionalId } from "mongodb";
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
};

type AttemptAnswer = { questionId: string; value: unknown };

type DbAttempt = {
  _id: ObjectId;
  assignmentId: ObjectId;
  examId: ObjectId;
  studentId: string;
  startedAt: Date;
  submittedAt: Date | null;
  answers: AttemptAnswer[];
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManual: boolean;
  breakdown: Array<{ questionId: string; points: number; earned: number; auto: boolean }>;
  status: "in_progress" | "submitted" | "graded";
};

const schema = z.object({ assignmentId: z.string().min(1) });

export async function POST(req: Request) {
  const guard = await requireUser(["student"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  if (!ObjectId.isValid(parsed.data.assignmentId)) {
    return Response.json({ error: "Invalid assignmentId" }, { status: 400 });
  }

  const db = await getDb();
  const assignmentId = new ObjectId(parsed.data.assignmentId);
  const assignment = await db.collection<DbAssignment>("assignments").findOne({ _id: assignmentId });
  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });
  if (!assignment.studentIds.includes(guard.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const attempts = db.collection<OptionalId<DbAttempt>>("attempts");
  const existing = await attempts.findOne({
    assignmentId,
    studentId: guard.user.id,
    submittedAt: null,
  });

  if (existing) {
    return Response.json({ attemptId: existing._id.toHexString() });
  }

  const now = new Date();
  const doc: OptionalId<DbAttempt> = {
    assignmentId,
    examId: assignment.examId,
    studentId: guard.user.id,
    startedAt: now,
    submittedAt: null,
    answers: [],
    autoScore: 0,
    manualScore: 0,
    totalScore: 0,
    needsManual: false,
    breakdown: [],
    status: "in_progress",
  };

  const result = await attempts.insertOne(doc);
  return Response.json({ attemptId: result.insertedId.toHexString() }, { status: 201 });
}

