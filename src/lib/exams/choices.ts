import type { ExamChoice } from "@/lib/exams/types";

/** Legacy exams stored choices as `string[]`. */
export function normalizeExamChoices(raw: unknown): ExamChoice[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c, idx) => {
    if (typeof c === "string") {
      return { id: `c_${idx}`, text: c, imageUrl: undefined };
    }
    if (c && typeof c === "object" && "text" in c) {
      const o = c as { id?: unknown; text?: unknown; imageUrl?: unknown };
      const text = typeof o.text === "string" ? o.text : String(o.text ?? "");
      const imageUrl = typeof o.imageUrl === "string" && o.imageUrl.trim() ? o.imageUrl.trim() : undefined;
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `c_${idx}`;
      return { id, text, imageUrl };
    }
    return { id: `c_${idx}`, text: String(c), imageUrl: undefined };
  });
}

export function choiceDisplayText(c: ExamChoice): string {
  return c.text.trim() ? c.text : c.imageUrl ? "(Image choice)" : "";
}
