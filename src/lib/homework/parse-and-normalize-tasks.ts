import type { HomeworkTask } from "./types";
import { homeworkTasksSchema } from "./task-schema";
import { normalizeHomeworkTasks } from "./normalize-tasks";

/** For POST: `undefined` = omit tasks; `null` = validation failed. */
export function parseHomeworkTasksForCreate(raw: HomeworkTask[] | undefined): HomeworkTask[] | undefined | null {
  if (!raw?.length) return undefined;
  const norm = normalizeHomeworkTasks(raw);
  const filtered = norm.filter((t) => !(t.kind === "paragraph" && !t.text.trim()));
  const ok = homeworkTasksSchema.safeParse(filtered);
  if (!ok.success) return null;
  return ok.data.length > 0 ? ok.data : undefined;
}

/** For PATCH: `[]` = clear tasks; `null` = validation failed. */
export function parseHomeworkTasksForPatch(raw: HomeworkTask[]): HomeworkTask[] | null {
  if (raw.length === 0) return [];
  const norm = normalizeHomeworkTasks(raw);
  const filtered = norm.filter((t) => !(t.kind === "paragraph" && !t.text.trim()));
  const ok = homeworkTasksSchema.safeParse(filtered);
  if (!ok.success) return null;
  return ok.data.length > 0 ? ok.data : [];
}
