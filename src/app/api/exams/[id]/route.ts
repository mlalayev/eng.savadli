import { ObjectId } from "mongodb";
import { z } from "zod";
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

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  active: z.boolean().optional(),
  questions: z
    .array(z.any())
    .optional()
    .transform((v) => v as unknown as ExamQuestion[]),
  structure: z.any().optional().transform((v) => v as unknown as ExamStructure),
});

function publicExam(row: DbExam) {
  return {
    id: row._id.toHexString(),
    title: row.title,
    program: row.program,
    mode: row.mode,
    active: row.active,
    questions: row.questions,
    structure: row.structure,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const row = await db.collection<DbExam>("exams").findOne({ _id: new ObjectId(id), deletedAt: null });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ exam: publicExam(row) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const update: Partial<Omit<DbExam, "_id">> = { updatedAt: new Date() };
  if (parsed.data.title) update.title = parsed.data.title.trim();
  if (typeof parsed.data.active === "boolean") update.active = parsed.data.active;
  if (parsed.data.questions) update.questions = parsed.data.questions;
  if (parsed.data.structure) update.structure = parsed.data.structure;

  const db = await getDb();
  const _id = new ObjectId(id);
  await db.collection<DbExam>("exams").updateOne({ _id, deletedAt: null }, { $set: update });

  const row = await db.collection<DbExam>("exams").findOne({ _id, deletedAt: null });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ exam: publicExam(row) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const db = await getDb();
  const _id = new ObjectId(id);
  const result = await db.collection<DbExam>("exams").updateOne(
    { _id, deletedAt: null },
    { $set: { deletedAt: new Date(), updatedAt: new Date(), active: false } },
  );
  if (result.matchedCount === 0) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

