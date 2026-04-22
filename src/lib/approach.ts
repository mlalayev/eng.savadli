export type ApproachStep = {
  step: string;
  title: string;
  summary: string;
  detail: string;
  bullets: readonly string[];
};

export const APPROACH_STEPS: readonly ApproachStep[] = [
  {
    step: "1",
    title: "Diagnose",
    summary: "Clarify goals, gaps, and the timeline you are working with.",
    detail:
      "We start with where you need English next — an exam date, a school milestone, or everyday fluency. That shapes what we measure and how fast we move.",
    bullets: [
      "Target score or skill outcome",
      "Current level and tricky question types",
      "Weekly time you can commit outside class",
    ],
  },
  {
    step: "2",
    title: "Practice",
    summary: "Targeted reps, real tasks, and feedback you can act on.",
    detail:
      "Sessions mix explanation with doing: timed sets, speaking rounds, writing plans, and error patterns we name in plain language — so you know what to fix next time.",
    bullets: [
      "Models and checklists you can reuse alone",
      "Honest corrections without drowning in jargon",
      "Homework that matches your bandwidth",
    ],
  },
  {
    step: "3",
    title: "Adjust",
    summary: "Each week we refine what works and drop what does not.",
    detail:
      "Progress is not linear. We revisit the plan often: double down on weak skills, ease off what is stable, and keep difficulty close to the edge of your comfort zone.",
    bullets: [
      "Short recap at the start of each lesson",
      "Pacing tuned to tests and school deadlines",
      "Clear next steps until we meet again",
    ],
  },
] as const;

export const APPROACH_VALUES: readonly { title: string; text: string }[] = [
  {
    title: "One-to-one focus",
    text: "No generic slides — every explanation and exercise ties back to your goals and your mistakes.",
  },
  {
    title: "Exam realism",
    text: "When you prep for IELTS or Digital SAT, we respect format, timing, and stamina — not just isolated grammar drills.",
  },
  {
    title: "Sustainable habits",
    text: "The aim is not only to perform on test day but to leave with study routines that still work after our last session.",
  },
] as const;
