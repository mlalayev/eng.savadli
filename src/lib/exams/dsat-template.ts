export type DsatPassage = {
  id: string;
  intros: string[];
  text: string[];
};

export type DsatChoiceQuestion = {
  id: string;
  question: string;
  choices: string[];
  correctChoiceIndex: number;
};

export type DsatExamTemplate = {
  id: string;
  title: string;
  modules: Array<{
    id: "rw1" | "rw2" | "math1" | "math2";
    label: string;
    kind: "dsat_rw_1" | "dsat_rw_2" | "dsat_math_1" | "dsat_math_2";
    durationSeconds: number;
    passages?: DsatPassage[];
    questionPassage?: Record<string, string>;
    questions: DsatChoiceQuestion[];
  }>;
};

export type DsatVerbalQuestion = DsatChoiceQuestion & { passageId: string };

export type DsatVerbalExamTemplate = {
  id: string;
  title: string;
  durationSeconds: number;
  verbal: {
    passages: DsatPassage[];
    questions: DsatVerbalQuestion[];
  };
};

export function createSatFullTemplate(): DsatExamTemplate {
  const rw1PassageId = "rw1_notre_dame";
  const rw2PassageId = "rw2_renewables";
  return {
    id: "sat_template_full_01",
    title: "Digital SAT · Full Practice Test (Template)",
    modules: [
      {
        id: "rw1",
        label: "Reading & Writing 1",
        kind: "dsat_rw_1",
        durationSeconds: 32 * 60,
        passages: [
          {
            id: rw1PassageId,
            intros: ["Directions", "Read the passage and answer the question."],
            text: [
              "Notre Dame Cathedral, a marvel of Gothic architecture, stands as a testament to the grandeur of France's ecclesiastical past. Its construction began in the 12th century, and it has since witnessed numerous historical events and transformations. Despite the ravages of time and the catastrophic fire in 2019, the cathedral's resilience is _____.",
              "Restoration works are in progress to bring back its past glory, while maintaining the original architectural integrity. The cathedral's importance extends beyond its religious significance, serving as a symbol of French heritage and a beacon of hope and resilience for the people of France.",
            ],
          },
        ],
        questions: [
          {
            id: "rw1_q1",
            question: "Which choice completes the text with the most logical and precise word or phrase?",
            choices: ["unimaginable", "unfathomable", "undeniable", "unbelievable"],
            correctChoiceIndex: 2,
          },
        ],
        questionPassage: { rw1_q1: rw1PassageId },
      },
      {
        id: "rw2",
        label: "Reading & Writing 2",
        kind: "dsat_rw_2",
        durationSeconds: 32 * 60,
        passages: [
          {
            id: rw2PassageId,
            intros: ["Directions", "Read the passage and answer the question."],
            text: [
              "Researchers studying energy transitions note that the cost of renewable technologies tends to decline as production scales. Yet the speed of adoption depends not only on price but also on infrastructure and policy. In this context, the most important factor for rapid grid decarbonization may be _____.",
            ],
          },
        ],
        questions: [
          {
            id: "rw2_q1",
            question: "Which choice best completes the text?",
            choices: ["inevitable", "incremental", "coordinated", "incidental"],
            correctChoiceIndex: 2,
          },
        ],
        questionPassage: { rw2_q1: rw2PassageId },
      },
      {
        id: "math1",
        label: "Math 1",
        kind: "dsat_math_1",
        durationSeconds: 35 * 60,
        questions: [
          {
            id: "m1_q1",
            question: "If 3x + 5 = 20, what is the value of x?",
            choices: ["3", "4", "5", "6"],
            correctChoiceIndex: 1,
          },
          {
            id: "m1_q2",
            question: "A line has slope 2 and passes through (1, 3). What is the y-intercept?",
            choices: ["1", "2", "3", "4"],
            correctChoiceIndex: 0,
          },
        ],
      },
      {
        id: "math2",
        label: "Math 2",
        kind: "dsat_math_2",
        durationSeconds: 35 * 60,
        questions: [
          {
            id: "m2_q1",
            question: "What is the value of \(x^2\) if x = -7?",
            choices: ["-49", "0", "49", "14"],
            correctChoiceIndex: 2,
          },
          {
            id: "m2_q2",
            question: "In a right triangle, if one acute angle is 30°, what is the ratio of the shortest side to the hypotenuse?",
            choices: ["1:2", "1:3", "2:3", "3:4"],
            correctChoiceIndex: 0,
          },
        ],
      },
    ],
  };
}

export function createSatVerbalTemplate(): DsatVerbalExamTemplate {
  const full = createSatFullTemplate();
  const rw1 = full.modules.find((m) => m.id === "rw1");
  if (!rw1) {
    throw new Error("createSatVerbalTemplate: rw1 module missing from full template");
  }

  const passages = rw1.passages ?? [];
  const questionPassage = rw1.questionPassage ?? {};
  const fallbackPassageId = passages[0]?.id ?? "";

  const questions: DsatVerbalQuestion[] = rw1.questions.map((q) => ({
    ...q,
    passageId: questionPassage[q.id] ?? fallbackPassageId,
  }));

  return {
    id: "sat_template_verbal_01",
    title: "Digital SAT · Reading & Writing (Template)",
    durationSeconds: rw1.durationSeconds,
    verbal: {
      passages,
      questions,
    },
  };
}
