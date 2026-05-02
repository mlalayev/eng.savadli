export type ExamProgram = "ielts" | "dsat" | "general";
export type ExamMode = "full" | "drill";

export type QuestionType = "mcq_single" | "short_text" | "numeric" | "writing" | "rich_text" | "html_interactive";

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
      /** Optional description/context for IELTS questions */
      description?: string;
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
      description?: string;
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
      description?: string;
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
      description?: string;
      points: number;
      rubric?: string;
      satSkill?: SatQuestionSkill;
    }
  | {
      id: string;
      sectionId?: string;
      type: "rich_text";
      /** Rich text content with markdown formatting */
      content: string;
      promptImageUrl?: string;
      description?: string;
      points: number;
      satSkill?: SatQuestionSkill;
    }
  | {
      id: string;
      sectionId?: string;
      type: "html_interactive";
      /** HTML code with input elements (text/radio) */
      htmlContent: string;
      /** CSS styling for the HTML */
      cssContent?: string;
      /** Instructions/prompt shown above the interactive HTML */
      prompt: string;
      promptImageUrl?: string;
      description?: string;
      /** Array of correct answers: { name: "q1", value: "correct answer" } or { name: "q2", value: "option_a" } */
      correctAnswers: Array<{ name: string; value: string; type: "text" | "radio" }>;
      points: number;
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

