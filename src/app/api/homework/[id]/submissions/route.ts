import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbClass } from "@/lib/classes/types";
import type { DbHomework } from "@/lib/homework/types";
import type { DbHomeworkProgress } from "@/lib/homework/progress-types";
import { publicHomeworkFields } from "@/lib/homework/serialize";

function canManageClass(userId: string, role: string, row: DbClass) {
  if (role === "creator") return true;
  return row.teacherIds.includes(userId);
}

async function loadHomeworkWithClass(db: Awaited<ReturnType<typeof getDb>>, id: string) {
  if (!ObjectId.isValid(id)) return { homework: null as DbHomework | null, cls: null as DbClass | null };
  const homework = await db.collection<DbHomework>("homework").findOne({ _id: new ObjectId(id) });
  if (!homework) return { homework: null, cls: null };
  const cls = await db.collection<DbClass>("classes").findOne({ _id: homework.classId });
  return { homework, cls };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const db = await getDb();
  const { homework, cls } = await loadHomeworkWithClass(db, id);
  if (!homework || !cls) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canManageClass(guard.user.id, guard.user.role, cls)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentIds = cls.studentIds ?? [];
  const progress = studentIds.length
    ? await db
        .collection<DbHomeworkProgress>("homework_progress")
        .find({ homeworkId: homework._id, studentId: { $in: studentIds } })
        .limit(2000)
        .toArray()
    : [];

  return Response.json({
    homework: {
      ...publicHomeworkFields(homework),
      classTitle: cls.title,
    },
    students: studentIds,
    progress: progress.map((p) => ({
      studentId: p.studentId,
      updatedAt: p.updatedAt.toISOString(),
      submitted: Object.fromEntries(
        Object.entries(p.submitted).map(([taskId, rec]) => [
          taskId,
          { submittedAt: rec.at.toISOString(), payload: rec.payload },
        ]),
      ),
    })),
  });
}

