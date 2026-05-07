import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import { createSatFullTemplate } from "@/lib/exams/dsat-template";
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

  const tpl = createSatFullTemplate();
  const now = new Date();

  const sectionDefs = tpl.modules.map((m) => ({
    id: m.id,
    label: m.label,
    kind: m.kind,
  }));

  const questions: ExamQuestion[] = tpl.modules.flatMap((m) =>
    m.questions.map((q) => ({
      id: q.id,
      sectionId: m.id,
      type: "mcq_single",
      prompt: q.question,
      choices: q.choices.map((text, idx) => ({ id: `${q.id}_c${idx + 1}`, text })),
      correctChoiceIndex: q.correctChoiceIndex,
      points: 1,
      satSkill:
        m.id === "math1" || m.id === "math2"
          ? { domain: "math", topic: "Algebra", subtopic: "Linear equations in one variable" }
          : { domain: "rw", topic: "Craft and Structure", subtopic: "Words in Context" },
    })),
  );

  const structure = {
    program: "dsat",
    mode: "full",
    sections: sectionDefs,
    passagesBySection: Object.fromEntries(
      tpl.modules
        .filter((m) => m.passages?.length)
        .map((m) => [m.id, m.passages]),
    ),
    questionPassageBySection: Object.fromEntries(
      tpl.modules
        .filter((m) => m.questionPassage && Object.keys(m.questionPassage).length)
        .map((m) => [m.id, m.questionPassage]),
    ),
    timerSecondsBySection: Object.fromEntries(tpl.modules.map((m) => [m.id, m.durationSeconds])),
  };

  const db = await getDb();
  const existing = await db
    .collection<DbExam>("exams")
    .findOne({ title: tpl.title, program: "dsat", mode: "full", deletedAt: null });

  if (existing) {
    return Response.json({ id: existing._id.toHexString(), existed: true }, { status: 200 });
  }

  const doc: Omit<DbExam, "_id"> = {
    title: tpl.title,
    program: "dsat",
    mode: "full",
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

