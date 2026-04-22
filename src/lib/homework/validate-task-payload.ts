import { z } from "zod";
import type { HomeworkTask } from "./types";
import { HOMEWORK_META_TASK_ID } from "./progress-types";

const essayPayload = z.object({
  text: z
    .string()
    .max(50_000)
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
});
const choicePayload = z.object({ selectedIndex: z.number().int().min(0) });
const fillPayload = z.object({ values: z.array(z.string()).max(40) });
const wordOrderPayload = z.object({ words: z.array(z.string()).min(1).max(80) });

function looseObject(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

export function validateTaskPayload(taskId: string, task: HomeworkTask | null, raw: unknown): unknown {
  if (taskId === HOMEWORK_META_TASK_ID) {
    return looseObject(raw);
  }
  if (!task) throw new Error("Unknown task");

  switch (task.kind) {
    case "paragraph":
    case "image":
      return looseObject(raw);
    case "essay":
      return essayPayload.parse(raw);
    case "choice": {
      const p = choicePayload.parse(raw);
      assertChoiceIndex(task, p.selectedIndex);
      return p;
    }
    case "fill": {
      const p = fillPayload.parse(raw);
      if (p.values.length !== task.blanks.length) {
        throw new Error("Fill-in: send one value per blank");
      }
      return p;
    }
    case "wordOrder":
      return wordOrderPayload.parse(raw);
    default:
      throw new Error("Unsupported task");
  }
}

export function assertChoiceIndex(task: Extract<HomeworkTask, { kind: "choice" }>, idx: number) {
  if (idx < 0 || idx >= task.options.length) throw new Error("Invalid option");
}
