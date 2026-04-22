export type ExamProgram = "ielts" | "dsat" | "general";
export type ExamMode = "full" | "drill";

export type QuestionType = "mcq_single" | "short_text" | "numeric" | "writing";

/** One MCQ option (text and/or image). */
export type ExamChoice = {
  id: string;
  text: string;
  imageUrl?: string;
};

export type ExamSectionKind =
  | "ielts_reading"
  | "ielts_listening"
  | "ielts_writing"
  | "ielts_speaking"
  | "dsat_rw_1"
  | "dsat_rw_2"
  | "dsat_math_1"
  | "dsat_math_2"
  | "general";

export type ExamSection = {
  id: string;
  label: string;
  kind: ExamSectionKind;
};

export type ExamStructure =
  | {
      program: "ielts";
      mode: ExamMode;
      sections: ExamSection[];
    }
  | {
      program: "dsat";
      mode: ExamMode;
      sections: ExamSection[];
    }
  | {
      program: "general";
      mode: ExamMode;
      sections: ExamSection[];
    };

/** SAT question skill tagging for analytics / student roadmap (topic + subtopic). */
export type SatQuestionSkill = {
  domain: "rw" | "math";
  topic: string;
  subtopic: string;
};

export type ExamQuestion =
  | {
      id: string;
      sectionId?: string;
      type: "mcq_single";
      prompt: string;
      /** Optional image shown with the question stem. */
      promptImageUrl?: string;
      choices: ExamChoice[];
      correctChoiceIndex: number;
      points: number;
      satSkill?: SatQuestionSkill;
    }
  | {
      id: string;
      sectionId?: string;
      type: "short_text";
      prompt: string;
      promptImageUrl?: string;
      correctAnswer: string;
      points: number;
      satSkill?: SatQuestionSkill;
    }
  | {
      id: string;
      sectionId?: string;
      type: "numeric";
      prompt: string;
      promptImageUrl?: string;
      correctNumber: number;
      points: number;
      satSkill?: SatQuestionSkill;
    }
  | {
      id: string;
      sectionId?: string;
      type: "writing";
      prompt: string;
      promptImageUrl?: string;
      points: number;
      rubric?: string;
      satSkill?: SatQuestionSkill;
    };

export type Exam = {
  id: string;
  title: string;
  program: ExamProgram;
  mode: ExamMode;
  active: boolean;
  questions: ExamQuestion[];
  structure?: ExamStructure;
  createdAt: string;
  updatedAt: string;
};

