import type { ProgramAccent } from "@/components/marketing/ProgramCard";

export type ProgramPageItem = {
  slug: string;
  accent: ProgramAccent;
  title: string;
  summary: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
};

export const PROGRAMS_PAGE_ITEMS: readonly ProgramPageItem[] = [
  {
    slug: "ielts",
    accent: "ielts",
    title: "IELTS",
    summary: "Task strategies, timed practice, and detailed feedback for band score goals.",
    features: [
      "Academic & General",
      "Listening",
      "Reading",
      "Writing",
      "Speaking",
      "Mock Exams",
      "Teacher Feedback",
    ],
    ctaLabel: "Explore IELTS",
    ctaHref: "/login",
  },
  {
    slug: "digital-sat",
    accent: "dsat",
    title: "Digital SAT",
    summary: "Reading, writing, and math aligned with the DSAT format and pacing.",
    features: [
      "Reading & Writing",
      "Math",
      "Adaptive Practice",
      "Timed Modules",
      "Score Tracking",
      "Exam Strategies",
    ],
    ctaLabel: "Explore Digital SAT",
    ctaHref: "/login",
  },
  {
    slug: "general-english",
    accent: "general",
    title: "General English",
    summary: "Fluency, vocabulary, and real-world communication at your level.",
    features: [
      "Grammar",
      "Vocabulary",
      "Reading",
      "Listening",
      "Writing",
      "Speaking",
      "Level-based Learning",
    ],
    ctaLabel: "Explore General English",
    ctaHref: "/login",
  },
] as const;

export type ComparisonCell = "yes" | "no" | "best";

export type ComparisonRow = {
  goal: string;
  ielts: ComparisonCell;
  dsat: ComparisonCell;
  general: ComparisonCell;
};

export const PROGRAM_COMPARISON: readonly ComparisonRow[] = [
  { goal: "Study Abroad", ielts: "best", dsat: "no", general: "no" },
  { goal: "University Admission", ielts: "yes", dsat: "best", general: "no" },
  { goal: "Improve English", ielts: "yes", dsat: "no", general: "best" },
  { goal: "Daily Communication", ielts: "no", dsat: "no", general: "best" },
  { goal: "International Exams", ielts: "best", dsat: "best", general: "no" },
] as const;

export const PROGRAMS_WHY_FEATURES = [
  {
    title: "Experienced teachers",
    description: "Instructors who know IELTS, Digital SAT, and General English inside out.",
  },
  {
    title: "Modern platform",
    description: "A calm, focused workspace — not cluttered slides or outdated PDFs.",
  },
  {
    title: "Practice exams",
    description: "Full and sectional mocks under real timing and conditions.",
  },
  {
    title: "Homework",
    description: "Assignments between classes that reinforce what you learned.",
  },
  {
    title: "Progress tracking",
    description: "See completion, accuracy, and growth across every skill.",
  },
  {
    title: "Personal feedback",
    description: "Writing and speaking reviewed with clear, actionable comments.",
  },
] as const;
