import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { ExamQuestion } from "@/lib/exams/types";

type DbAssignment = {
  _id: ObjectId;
  kind: "exam";
  examId: ObjectId;
  title: string;
  dueAt: Date | null;
  studentIds: string[];
  createdAt: Date;
};

type DbExam = {
  _id: ObjectId;
  title: string;
  program: string;
  mode: string;
  active?: boolean;
  deletedAt?: Date | null;
  questions: ExamQuestion[];
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["student", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const assignment = await db
    .collection<DbAssignment>("assignments")
    .findOne({ _id: new ObjectId(id) });
  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });

  if (guard.user.role === "student" && !assignment.studentIds.includes(guard.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const exam = await db
    .collection<DbExam>("exams")
    .findOne({ _id: assignment.examId, active: true, deletedAt: null });
  if (!exam) return Response.json({ error: "Exam missing or inactive" }, { status: 409 });

  return Response.json({
    assignment: {
      id: assignment._id.toHexString(),
      title: assignment.title,
      dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
      createdAt: assignment.createdAt.toISOString(),
      exam: {
        id: exam._id.toHexString(),
        title: exam.title,
        program: exam.program,
        mode: exam.mode,
        questions: exam.questions,
      },
    },
  });
}

