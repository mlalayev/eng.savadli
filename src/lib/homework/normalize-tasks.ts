import type { HomeworkTask } from "./types";

/** Trim text fields before persistence / re-validation. */
export function normalizeHomeworkTasks(tasks: HomeworkTask[]): HomeworkTask[] {
  return tasks.map((t) => {
    switch (t.kind) {
      case "paragraph":
        return { ...t, text: t.text.trim() };
      case "image":
        return { ...t, url: t.url.trim(), caption: t.caption?.trim() || undefined };
      case "essay":
        return { ...t, prompt: t.prompt.trim() };
      case "choice":
        return {
          ...t,
          prompt: t.prompt.trim(),
          options: t.options.map((o) => o.trim()),
        };
      case "fill":
        return {
          ...t,
          prompt: t.prompt.trim(),
          blanks: t.blanks.map((row) => row.map((s) => s.trim()).filter((s) => s.length > 0)),
        };
      case "wordOrder":
        return { ...t, sentence: t.sentence.trim() };
      default:
        return t;
    }
  });
}
