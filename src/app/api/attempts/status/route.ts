import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";

type DbAttempt = {
  _id: ObjectId;
  examId: ObjectId;
  studentId: string;
  startedAt: Date;
  submittedAt: Date | null;
  status: "in_progress" | "submitted" | "graded";
};

const querySchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().min(1),
});

export async function GET(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    studentId: url.searchParams.get("studentId") ?? "",
    examId: url.searchParams.get("examId") ?? "",
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  if (!ObjectId.isValid(parsed.data.examId)) {
    return Response.json({ error: "Invalid examId" }, { status: 400 });
  }

  const db = await getDb();
  const examId = new ObjectId(parsed.data.examId);
  const attempt = await db
    .collection<DbAttempt>("attempts")
    .find({ studentId: parsed.data.studentId, examId })
    .sort({ startedAt: -1 })
    .limit(1)
    .next();

  if (!attempt) {
    return Response.json(
      {
        status: {
          exists: false,
          status: "none",
          startedAt: null,
          submittedAt: null,
        },
      },
      { status: 200 },
    );
  }

  return Response.json(
    {
      status: {
        exists: true,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
      },
    },
    { status: 200 },
  );
}

