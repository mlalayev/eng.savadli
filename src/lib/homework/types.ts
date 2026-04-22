import type { ObjectId } from "mongodb";

/** One interactive or content block inside an assignment (stored as JSON). */
export type HomeworkTask =
  | { id: string; kind: "paragraph"; text: string }
  | { id: string; kind: "image"; url: string; caption?: string }
  | { id: string; kind: "essay"; prompt: string }
  | { id: string; kind: "choice"; prompt: string; options: string[]; correctIndex: number }
  | { id: string; kind: "fill"; prompt: string; blanks: string[][] }
  | { id: string; kind: "wordOrder"; sentence: string };

export type DbHomework = {
  _id: ObjectId;
  classId: ObjectId;
  title: string;
  instructions: string;
  /** Optional structured activities (images, MCQ, essay, blanks, word order). */
  tasks?: HomeworkTask[];
  dueAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};
