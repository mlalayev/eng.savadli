export type PracticeArea = {
  title: string;
  description: string;
};

export const IELTS_PRACTICE: readonly PracticeArea[] = [
  {
    title: "Listening",
    description: "Section-style audio drills with question types from Parts 1–4.",
  },
  {
    title: "Reading",
    description: "Passage practice with timing, skimming, and accuracy tracking.",
  },
  {
    title: "Writing",
    description: "Task 1 and Task 2 prompts with structure guides and teacher review.",
  },
  {
    title: "Speaking",
    description: "Parts 1–3 practice with prompts and feedback on fluency and coherence.",
  },
] as const;

export const DSAT_PRACTICE: readonly PracticeArea[] = [
  {
    title: "Reading & Writing",
    description: "Evidence-based questions in a Bluebook-style interface.",
  },
  {
    title: "Math",
    description: "Algebra, problem-solving, and advanced topics with worked solutions.",
  },
  {
    title: "Adaptive Modules",
    description: "Module difficulty that mirrors the real Digital SAT experience.",
  },
  {
    title: "Timed Exams",
    description: "Full-length mocks with section timing and break simulation.",
  },
] as const;

export const GENERAL_ENGLISH_PRACTICE: readonly PracticeArea[] = [
  {
    title: "Grammar",
    description: "Targeted exercises on tenses, structure, and common errors.",
  },
  {
    title: "Vocabulary",
    description: "Curated word lists with context and spaced review.",
  },
  {
    title: "Speaking",
    description: "Conversation prompts and pronunciation practice.",
  },
  {
    title: "Listening",
    description: "Real-world audio at varied speeds and accents.",
  },
  {
    title: "Reading",
    description: "Articles and passages matched to your level.",
  },
  {
    title: "Writing",
    description: "Short compositions with feedback on clarity and tone.",
  },
] as const;

export const PRACTICE_PLATFORM_FEATURES = [
  {
    title: "Timed exams",
    description: "Practice under real exam conditions — no surprises on test day.",
  },
  {
    title: "Auto scoring",
    description: "Instant results for objective sections so you know where you stand.",
  },
  {
    title: "Teacher feedback",
    description: "Writing and speaking reviewed with clear, actionable comments.",
  },
  {
    title: "Homework",
    description: "Assigned tasks between sessions to reinforce what you learned.",
  },
  {
    title: "Progress analytics",
    description: "Track completion, accuracy, and growth across every skill.",
  },
  {
    title: "Performance reports",
    description: "Clear score breakdowns and trends over time.",
  },
  {
    title: "Weak area detection",
    description: "See which topics need attention — not just your overall score.",
  },
  {
    title: "Practice history",
    description: "Review past attempts and measure improvement session by session.",
  },
] as const;

export const PRACTICE_FLOW_STEPS = [
  { step: "Practice", description: "Complete timed drills, mocks, and homework." },
  { step: "Review", description: "See scores, explanations, and teacher comments." },
  { step: "Improve", description: "Focus on weak areas with targeted exercises." },
  { step: "Repeat", description: "Build consistency with regular practice sessions." },
  { step: "Master", description: "Walk into your exam with confidence and control." },
] as const;
