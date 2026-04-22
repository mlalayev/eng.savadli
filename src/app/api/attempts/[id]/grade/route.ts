import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { ExamQuestion } from "@/lib/exams/types";

type AttemptAnswer = { questionId: string; value: unknown };

type DbAttempt = {
  _id: ObjectId;
  examId: ObjectId;
  studentId: string;
  submittedAt: Date | null;
  answers: AttemptAnswer[];
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManual: boolean;
  breakdown: Array<{ questionId: string; points: number; earned: number; auto: boolean }>;
  status: "in_progress" | "submitted" | "graded";
  manualGrades?: Array<{ questionId: string; earned: number; feedback?: string }>;
};

type DbExam = {
  _id: ObjectId;
  questions: ExamQuestion[];
};

const gradeSchema = z.object({
  grades: z.array(
    z.object({
      questionId: z.string().min(1),
      earned: z.number().min(0),
      feedback: z.string().max(5000).optional(),
    }),
  ),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const attempts = db.collection<DbAttempt>("attempts");
  const _id = new ObjectId(id);
  const attempt = await attempts.findOne({ _id });
  if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });
  if (!attempt.submittedAt) return Response.json({ error: "Attempt not submitted" }, { status: 409 });

  const exam = await db.collection<DbExam>("exams").findOne({ _id: attempt.examId });
  if (!exam) return Response.json({ error: "Exam missing" }, { status: 409 });

  const pointsByQ = new Map(exam.questions.map((q) => [q.id, q.points]));
  let manualScore = 0;
  const manualGrades = parsed.data.grades.map((g) => {
    const max = pointsByQ.get(g.questionId) ?? 0;
    const earned = Math.max(0, Math.min(g.earned, max));
    manualScore += earned;
    return { questionId: g.questionId, earned, feedback: g.feedback?.trim() || undefined };
  });

  const totalScore = attempt.autoScore + manualScore;

  // merge breakdown for manual questions
  const breakdown = attempt.breakdown.map((b) => {
    if (b.auto) return b;
    const row = manualGrades.find((g) => g.questionId === b.questionId);
    return row ? { ...b, earned: row.earned } : b;
  });

  await attempts.updateOne(
    { _id },
    {
      $set: {
        manualGrades,
        manualScore,
        totalScore,
        breakdown,
        status: "graded",
      },
    },
  );

  return Response.json({ ok: true });
}

