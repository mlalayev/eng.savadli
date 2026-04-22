export type Program = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  outcomes: readonly string[];
};

export const PROGRAMS: readonly Program[] = [
  {
    slug: "general-english",
    title: "General English",
    summary:
      "Fluency, vocabulary, and real-world communication — built around your level and interests.",
    description:
      "Lessons meet you where you are: guided conversation, structured feedback on grammar and vocabulary, and tasks that mirror how you actually use English day to day.",
    outcomes: [
      "Clearer speaking with fewer hesitations",
      "Stronger listening for real accents and speeds",
      "Writing and reading habits you can sustain on your own",
    ],
  },
  {
    slug: "ielts",
    title: "IELTS",
    summary: "Task strategies, timed practice, and detailed feedback for band score goals.",
    description:
      "We work the full exam: format familiarity, time discipline, and models for strong responses in Writing and Speaking, with honest scoring against descriptors.",
    outcomes: [
      "Question-type strategies for Listening and Reading",
      "Speaking Parts 1–3 with structured practice",
      "Writing Task 1 & 2 planning, cohesion, and self-edit routines",
    ],
  },
  {
    slug: "digital-sat",
    title: "Digital SAT",
    summary: "Reading, writing, and test mechanics aligned with the DSAT format and pacing.",
    description:
      "Focus on evidence-based reading, craft and structure, and the digital interface — so test day feels familiar, not frantic.",
    outcomes: [
      "Pacing and elimination tactics for adaptive sections",
      "Grammar and rhetoric in context (Writing)",
      "Practice sets mapped to your target score band",
    ],
  },
] as const;
