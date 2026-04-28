import type { QuestionType, ExamChoice, ExamQuestion, SatQuestionSkill } from "@/lib/exams/types";
import type { IeltsGroup } from "./types";

export function uid() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

export function questionTypeLabel(type: QuestionType): string {
  switch (type) {
    case "mcq_single":
      return "Multiple choice";
    case "short_text":
      return "Short answer";
    case "numeric":
      return "Student-produced response (number)";
    case "writing":
      return "Written response";
    case "rich_text":
      return "Rich text (formatted content)";
    default:
      return type;
  }
}

export function formatRichText(content: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Supported markers (teacher-friendly):
  // - **bold**
  // - __italic__ (also supports *italic* for backwards compatibility)
  // - ~~strikethrough~~
  // - ~underline~ (also supports _underline_ for backwards compatibility)
  // - [title] ... [title]
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicDoubleUnderscoreRegex = /__(.*?)__/g;
  const italicStarRegex = /\*(.*?)\*/g;
  const strikeRegex = /~~(.*?)~~/g;
  const underlineTildeRegex = /~(.*?)~/g;
  const underlineUnderscoreRegex = /_(.*?)_/g;
  const titleRegex = /\[title\]([\s\S]*?)\[title\]/gi;

  type TokenType = "title" | "bold" | "italic" | "underline" | "strike";
  const tokens: Array<{ start: number; end: number; type: TokenType; content: string }> = [];

  function pushMatches(regex: RegExp, type: TokenType) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      tokens.push({ start: match.index, end: match.index + match[0].length, type, content: match[1] ?? "" });
    }
  }

  // Order matters: longer / more specific first to avoid conflicts
  pushMatches(titleRegex, "title");
  pushMatches(strikeRegex, "strike");
  pushMatches(boldRegex, "bold");
  pushMatches(italicDoubleUnderscoreRegex, "italic");
  pushMatches(underlineTildeRegex, "underline");
  // Backwards-compatible fallbacks (avoid overlaps)
  pushMatches(italicStarRegex, "italic");
  pushMatches(underlineUnderscoreRegex, "underline");

  // Remove overlaps: keep earliest tokens first; if a token starts inside an existing token, skip it
  tokens.sort((a, b) => a.start - b.start || b.end - a.end);
  const filtered: typeof tokens = [];
  for (const t of tokens) {
    const overlaps = filtered.some((x) => x.start < t.end && t.start < x.end);
    if (!overlaps) filtered.push(t);
  }
  filtered.sort((a, b) => a.start - b.start);

  let lastIndex = 0;
  for (const token of filtered) {
    if (token.start > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, token.start)}</span>);
    }
    if (token.type === "title") {
      parts.push(
        <span key={key++} className="block text-base font-semibold text-[var(--text)]">
          {token.content.trim()}
        </span>,
      );
    } else if (token.type === "bold") {
      parts.push(<strong key={key++}>{token.content}</strong>);
    } else if (token.type === "italic") {
      parts.push(<em key={key++}>{token.content}</em>);
    } else if (token.type === "underline") {
      parts.push(<u key={key++}>{token.content}</u>);
    } else if (token.type === "strike") {
      parts.push(<s key={key++}>{token.content}</s>);
    }
    lastIndex = token.end;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : <span>{content}</span>;
}

export function emptyChoiceRow(): ExamChoice {
  return { id: uid(), text: "", imageUrl: undefined };
}

export function attachSatSkill<T extends ExamQuestion>(q: T, skill: SatQuestionSkill | undefined): T {
  if (!skill) return q;
  return { ...q, satSkill: skill };
}

export function ieltsGroupForSectionId(sectionId: string): IeltsGroup | null {
  if (sectionId === "listening" || sectionId.startsWith("listening_")) return "listening";
  if (sectionId === "reading" || sectionId.startsWith("reading_")) return "reading";
  if (sectionId === "writing" || sectionId.startsWith("writing_")) return "writing";
  if (sectionId === "speaking" || sectionId.startsWith("speaking_")) return "speaking";
  return null;
}

export function ieltsGroupLabel(g: IeltsGroup): string {
  switch (g) {
    case "listening":
      return "Listening";
    case "reading":
      return "Reading";
    case "writing":
      return "Writing";
    case "speaking":
      return "Speaking";
    default:
      return g;
  }
}

export function satSkillLabel(skill: SatQuestionSkill): string {
  return `${skill.domain.toUpperCase()} · ${skill.topic} · ${skill.subtopic}`;
}

export function choiceDisplayText(choice: ExamChoice): string {
  if (choice.text && choice.imageUrl) return `${choice.text} (+ image)`;
  if (choice.imageUrl) return "(image only)";
  return choice.text;
}
