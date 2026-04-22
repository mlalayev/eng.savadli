import type { DbHomeworkProgress } from "./progress-types";

export type HomeworkSubmissionJson = {
  byTask: Record<string, { submittedAt: string; payload: unknown }>;
  updatedAt: string;
};

export function submissionFromProgressDoc(p: DbHomeworkProgress | null): HomeworkSubmissionJson | null {
  if (!p) return null;
  const byTask: Record<string, { submittedAt: string; payload: unknown }> = {};
  for (const [k, v] of Object.entries(p.submitted)) {
    byTask[k] = { submittedAt: v.at.toISOString(), payload: v.payload };
  }
  return { byTask, updatedAt: p.updatedAt.toISOString() };
}
