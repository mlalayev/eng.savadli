import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import { createSatVerbalTemplate } from "@/lib/exams/dsat-template";
import type { ExamQuestion } from "@/lib/exams/types";

type DbExam = {
  _id: ObjectId;
  title: string;
  program: string;
  mode: string;
  active: boolean;
  deletedAt: Date | null;
  questions: ExamQuestion[];
  structure?: unknown;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST() {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const tpl = createSatVerbalTemplate();
  const now = new Date();

  const questions: ExamQuestion[] = tpl.verbal.questions.map((q) => ({
    id: q.id,
    sectionId: "rw1",
    type: "mcq_single",
    prompt: q.question,
    choices: q.choices.map((text, idx) => ({ id: `${q.id}_c${idx + 1}`, text })),
    correctChoiceIndex: q.correctChoiceIndex,
    points: 1,
    satSkill: { domain: "rw", topic: "Craft and Structure", subtopic: "Words in Context" },
  }));

  const structure = {
    program: "dsat",
    mode: "drill",
    sections: [{ id: "rw1", label: "Reading & Writing", kind: "dsat_rw_1" }],
    passages: tpl.verbal.passages,
    questionPassage: Object.fromEntries(tpl.verbal.questions.map((q) => [q.id, q.passageId])),
    timerSeconds: tpl.durationSeconds,
  };

  const db = await getDb();
  const existing = await db
    .collection<DbExam>("exams")
    .findOne({ title: tpl.title, program: "dsat", deletedAt: null });

  if (existing) {
    return Response.json({ id: existing._id.toHexString(), existed: true }, { status: 200 });
  }

  const doc: Omit<DbExam, "_id"> = {
    title: tpl.title,
    program: "dsat",
    mode: "drill",
    active: true,
    deletedAt: null,
    questions,
    structure,
    createdBy: guard.user.id,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<Omit<DbExam, "_id">>("exams").insertOne(doc);
  return Response.json({ id: result.insertedId.toHexString(), existed: false }, { status: 201 });
}

