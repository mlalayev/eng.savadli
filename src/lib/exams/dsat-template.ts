export type DsatVerbalPassage = {
  id: string;
  intros: string[];
  text: string[];
};

export type DsatVerbalQuestion = {
  id: string;
  passageId: string;
  question: string;
  choices: string[];
  correctChoiceIndex: number;
};

export type DsatExamTemplate = {
  id: string;
  title: string;
  durationSeconds: number;
  verbal: {
    passages: DsatVerbalPassage[];
    questions: DsatVerbalQuestion[];
  };
};

export function createSatVerbalTemplate(): DsatExamTemplate {
  const passageId = "passage_notre_dame";
  return {
    id: "sat_template_verbal_01",
    title: "Digital SAT · Reading & Writing (Template)",
    durationSeconds: 31 * 60 + 14,
    verbal: {
      passages: [
        {
          id: passageId,
          intros: ["Directions", "Read the passage and answer the question."],
          text: [
            "Notre Dame Cathedral, a marvel of Gothic architecture, stands as a testament to the grandeur of France's ecclesiastical past. Its construction began in the 12th century, and it has since witnessed numerous historical events and transformations. Despite the ravages of time and the catastrophic fire in 2019, the cathedral's resilience is _____.",
            "Restoration works are in progress to bring back its past glory, while maintaining the original architectural integrity. The cathedral's importance extends beyond its religious significance, serving as a symbol of French heritage and a beacon of hope and resilience for the people of France.",
          ],
        },
      ],
      questions: [
        {
          id: "q1",
          passageId,
          question: "Which choice completes the text with the most logical and precise word or phrase?",
          choices: ["unimaginable", "unfathomable", "undeniable", "unbelievable"],
          correctChoiceIndex: 2,
        },
      ],
    },
  };
}

