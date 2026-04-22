import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";

type DbAttempt = {
  _id: ObjectId;
  assignmentId: ObjectId;
  examId: ObjectId;
  studentId: string;
  submittedAt: Date | null;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManual: boolean;
  status: string;
};

type DbAssignment = {
  _id: ObjectId;
  title: string;
};

type DbExam = {
  _id: ObjectId;
  title: string;
  program: string;
  mode: string;
};

type DbUser = {
  _id: ObjectId;
  name: string;
  email: string;
};

export async function GET(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "all";

  const db = await getDb();
  const q: Record<string, unknown> =
    filter === "needs_manual"
      ? { submittedAt: { $ne: null }, needsManual: true, status: { $in: ["submitted"] } }
      : { submittedAt: { $ne: null } };

  const attempts = await db
    .collection<DbAttempt>("attempts")
    .find(q)
    .sort({ submittedAt: -1 })
    .limit(500)
    .toArray();

  const assignmentIds = Array.from(new Set(attempts.map((a) => a.assignmentId.toHexString())));
  const examIds = Array.from(new Set(attempts.map((a) => a.examId.toHexString())));
  const studentIds = Array.from(new Set(attempts.map((a) => a.studentId)));

  const [assignments, exams, students] = await Promise.all([
    assignmentIds.length
      ? db
          .collection<DbAssignment>("assignments")
          .find({ _id: { $in: assignmentIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
    examIds.length
      ? db
          .collection<DbExam>("exams")
          .find({ _id: { $in: examIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
    studentIds.length
      ? db
          .collection<DbUser>("users")
          .find({ _id: { $in: studentIds.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
  ]);

  const assignmentById = new Map(assignments.map((a) => [a._id.toHexString(), a]));
  const examById = new Map(exams.map((e) => [e._id.toHexString(), e]));
  const studentById = new Map(students.map((s) => [s._id.toHexString(), s]));

  return Response.json({
    attempts: attempts.map((a) => {
      const assignment = assignmentById.get(a.assignmentId.toHexString());
      const exam = examById.get(a.examId.toHexString());
      const student = studentById.get(a.studentId);
      return {
        id: a._id.toHexString(),
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
        needsManual: a.needsManual,
        status: a.status,
        autoScore: a.autoScore,
        manualScore: a.manualScore,
        totalScore: a.totalScore,
        assignment: assignment ? { id: assignment._id.toHexString(), title: assignment.title } : null,
        exam: exam
          ? { id: exam._id.toHexString(), title: exam.title, program: exam.program, mode: exam.mode }
          : null,
        student: student ? { id: student._id.toHexString(), name: student.name, email: student.email } : null,
      };
    }),
  });
}

