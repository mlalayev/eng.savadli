import type { ExamSection, ExamSectionKind } from "@/lib/exams/types";

/** Digital SAT Reading & Writing — domain content dimensions (topic → subtopics). */
export const SAT_RW_TAXONOMY = [
  {
    topic: "Information and Ideas",
    subtopics: ["Central Ideas and Details", "Inferences", "Command of Evidence"],
  },
  {
    topic: "Craft and Structure",
    subtopics: ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"],
  },
  {
    topic: "Expression of Ideas",
    subtopics: ["Rhetorical Synthesis", "Transitions"],
  },
  {
    topic: "Standard English Conventions",
    subtopics: ["Boundaries", "Form, Structure, and Sense"],
  },
] as const;

/** Digital SAT Math — topic → subtopic lines (College Board–style scope). */
export const SAT_MATH_TAXONOMY = [
  {
    topic: "Algebra",
    subtopics: [
      "Linear equations in one variable",
      "Linear functions",
      "Linear equations in two variables",
      "Systems of two linear equations in two variables",
      "Linear inequalities in one or two variables",
    ],
  },
  {
    topic: "Advanced Math",
    subtopics: [
      "Nonlinear functions",
      "Nonlinear equations in one variable and systems of equations in two variables",
      "Equivalent expressions",
    ],
  },
  {
    topic: "Problem-Solving and Data Analysis",
    subtopics: [
      "Ratios, rates, proportional relationships, and units",
      "Percentages",
      "One-variable data: Distributions and measures of center and spread",
      "Two-variable data: Models and scatterplots",
      "Probability and conditional probability",
      "Inference from sample statistics and margin of error",
      "Evaluating statistical claims: Observational studies and experiments",
    ],
  },
  {
    topic: "Geometry and Trigonometry",
    subtopics: [
      "Area and volume",
      "Lines, angles, and triangles",
      "Right triangles and trigonometry",
      "Circles",
    ],
  },
] as const;

export type SatSkillDomain = "rw" | "math";

export function isRwSectionKind(kind: ExamSectionKind): boolean {
  return kind === "dsat_rw_1" || kind === "dsat_rw_2";
}

export function isMathSectionKind(kind: ExamSectionKind): boolean {
  return kind === "dsat_math_1" || kind === "dsat_math_2";
}

/** Infer RW vs Math from section row (for skill tagging + roadmap). */
export function satSkillDomainForSection(section: ExamSection | undefined): SatSkillDomain | null {
  if (!section) return null;
  if (isRwSectionKind(section.kind)) return "rw";
  if (isMathSectionKind(section.kind)) return "math";
  return null;
}

export function taxonomyForDomain(domain: SatSkillDomain) {
  return domain === "rw" ? SAT_RW_TAXONOMY : SAT_MATH_TAXONOMY;
}

export function subtopicsForTopic(domain: SatSkillDomain, topic: string): readonly string[] {
  const row = taxonomyForDomain(domain).find((t) => t.topic === topic);
  return row?.subtopics ?? [];
}

export function isValidSatSkill(domain: SatSkillDomain, topic: string, subtopic: string): boolean {
  const subs = subtopicsForTopic(domain, topic);
  return subs.includes(subtopic);
}
