import type { ExamQuestion, ExamStructure, ExamChoice } from "@/lib/exams/types";

export type Exam = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  mode: "full" | "drill";
  active: boolean;
  questions: ExamQuestion[];
  structure?: ExamStructure;
};

export type ExamEditorProps = {
  exam: Exam;
  onUpdate: () => Promise<void>;
};

export type IeltsGroup = "listening" | "reading" | "writing" | "speaking";

export type IeltsSectionMaterial = {
  text?: string;
  audioUrl?: string;
};

export type IeltsMaterialsMap = Record<string, IeltsSectionMaterial>;

export const IELTS_LISTENING_AUDIO_KEY = "__ielts_listening_audio__" as const;
export type IELTS_LISTENING_AUDIO_KEY = typeof IELTS_LISTENING_AUDIO_KEY;

export type QuestionFormState = {
  newType: ExamQuestion["type"];
  prompt: string;
  promptImageUrl: string;
  description: string;
  richTextContent: string;
  points: number;
  choiceRows: ExamChoice[];
  correctChoiceIndex: number;
  correctAnswer: string;
  correctNumber: number;
  rubric: string;
  satTopic: string;
  satSubtopic: string;
};
