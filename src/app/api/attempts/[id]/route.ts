import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { ExamQuestion } from "@/lib/exams/types";

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

type DbExam = {
  _id: ObjectId;
  title: string;
  active?: boolean;
  deletedAt?: Date | null;
  questions: ExamQuestion[];
};

const patchSchema = z.object({
  answers: z.array(z.object({ questionId: z.string().min(1), value: z.unknown() })).optional(),
  submit: z.boolean().optional(),
});

function normalizeText(v: unknown) {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function grade(exam: DbExam, answers: AttemptAnswer[]) {
  const byQ = new Map(answers.map((a) => [a.questionId, a.value]));
  let autoScore = 0;
  let needsManual = false;
  const breakdown: DbAttempt["breakdown"] = [];

  for (const q of exam.questions) {
    const value = byQ.get(q.id);
    if (q.type === "mcq_single") {
      const earned = Number(value) === q.correctChoiceIndex ? q.points : 0;
      autoScore += earned;
      breakdown.push({ questionId: q.id, points: q.points, earned, auto: true });
      continue;
    }
    if (q.type === "numeric") {
      const n = typeof value === "number" ? value : Number(value);
      const earned = Number.isFinite(n) && n === q.correctNumber ? q.points : 0;
      autoScore += earned;
      breakdown.push({ questionId: q.id, points: q.points, earned, auto: true });
      continue;
    }
    if (q.type === "short_text") {
      const earned = normalizeText(value) === normalizeText(q.correctAnswer) ? q.points : 0;
      autoScore += earned;
      breakdown.push({ questionId: q.id, points: q.points, earned, auto: true });
      continue;
    }

    needsManual = true;
    breakdown.push({ questionId: q.id, points: q.points, earned: 0, auto: false });
  }

  return { autoScore, needsManual, breakdown };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["student", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const attempt = await db.collection<DbAttempt>("attempts").findOne({ _id: new ObjectId(id) });
  if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });

  if (guard.user.role === "student" && attempt.studentId !== guard.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({
    attempt: {
      id: attempt._id.toHexString(),
      assignmentId: attempt.assignmentId.toHexString(),
      examId: attempt.examId.toHexString(),
      studentId: attempt.studentId,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
      answers: attempt.answers,
      autoScore: attempt.autoScore,
      manualScore: attempt.manualScore,
      totalScore: attempt.totalScore,
      needsManual: attempt.needsManual,
      status: attempt.status,
      breakdown: attempt.breakdown,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["student"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const attempts = db.collection<DbAttempt>("attempts");
  const _id = new ObjectId(id);
  const attempt = await attempts.findOne({ _id });
  if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });
  if (attempt.studentId !== guard.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (attempt.submittedAt) {
    return Response.json({ error: "Attempt already submitted" }, { status: 409 });
  }

  const nextAnswers = parsed.data.answers ?? attempt.answers;

  if (parsed.data.submit) {
    const exam = await db
      .collection<DbExam>("exams")
      .findOne({ _id: attempt.examId, active: true, deletedAt: null });
    if (!exam) return Response.json({ error: "Exam missing or inactive" }, { status: 409 });

    const graded = grade(exam, nextAnswers);
    const manualScore = 0;
    const totalScore = graded.autoScore + manualScore;

    await attempts.updateOne(
      { _id },
      {
        $set: {
          answers: nextAnswers,
          submittedAt: new Date(),
          autoScore: graded.autoScore,
          manualScore,
          totalScore,
          needsManual: graded.needsManual,
          breakdown: graded.breakdown,
          status: graded.needsManual ? "submitted" : "graded",
        },
      },
    );
  } else if (parsed.data.answers) {
    await attempts.updateOne({ _id }, { $set: { answers: nextAnswers } });
  }

  const updated = await attempts.findOne({ _id });
  return Response.json({
    attempt: updated
      ? {
          id: updated._id.toHexString(),
          submittedAt: updated.submittedAt ? updated.submittedAt.toISOString() : null,
          answers: updated.answers,
          autoScore: updated.autoScore,
          manualScore: updated.manualScore,
          totalScore: updated.totalScore,
          needsManual: updated.needsManual,
          status: updated.status,
          breakdown: updated.breakdown,
        }
      : null,
  });
}

