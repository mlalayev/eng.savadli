import type { ObjectId } from "mongodb";
import type { HomeworkTask } from "./types";

/** Single homework with only instructions (no task blocks) uses this pseudo id. */
export const HOMEWORK_META_TASK_ID = "__homework__";

export type TaskSubmissionRecord = {
  at: Date;
  payload: unknown;
};

export type DbHomeworkProgress = {
  _id: ObjectId;
  homeworkId: ObjectId;
  studentId: string;
  submitted: Record<string, TaskSubmissionRecord>;
  createdAt: Date;
  updatedAt: Date;
};

export function requiredSubmissionIds(tasks: HomeworkTask[] | undefined): string[] {
  const list = tasks ?? [];
  if (list.length === 0) return [HOMEWORK_META_TASK_ID];
  return list.map((t) => t.id);
}

/** Accepts DB `submitted` or API `submission.byTask` (any object value per id). */
export function isHomeworkComplete(
  tasks: HomeworkTask[] | undefined,
  submitted: Record<string, unknown> | undefined,
): boolean {
  const ids = requiredSubmissionIds(tasks);
  if (!submitted) return false;
  return ids.every((id) => Object.prototype.hasOwnProperty.call(submitted, id));
}

export function submittedCount(
  tasks: HomeworkTask[] | undefined,
  submitted: Record<string, unknown> | undefined,
): number {
  const ids = requiredSubmissionIds(tasks);
  if (!submitted) return 0;
  return ids.filter((id) => Object.prototype.hasOwnProperty.call(submitted, id)).length;
}
