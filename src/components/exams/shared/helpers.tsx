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

  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;
  const underlineRegex = /_(.*?)_/g;

  let lastIndex = 0;
  const tokens: Array<{ start: number; end: number; type: "bold" | "italic" | "underline"; content: string }> = [];

  let match: RegExpExecArray | null;
  boldRegex.lastIndex = 0;
  while ((match = boldRegex.exec(content)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length, type: "bold", content: match[1] });
  }

  italicRegex.lastIndex = 0;
  while ((match = italicRegex.exec(content)) !== null) {
    const isBold = tokens.some((t) => t.start <= match!.index && match!.index < t.end);
    if (!isBold) {
      tokens.push({ start: match.index, end: match.index + match[0].length, type: "italic", content: match[1] });
    }
  }

  underlineRegex.lastIndex = 0;
  while ((match = underlineRegex.exec(content)) !== null) {
    const isOther = tokens.some((t) => t.start <= match!.index && match!.index < t.end);
    if (!isOther) {
      tokens.push({ start: match.index, end: match.index + match[0].length, type: "underline", content: match[1] });
    }
  }

  tokens.sort((a, b) => a.start - b.start);

  tokens.forEach((token) => {
    if (token.start > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, token.start)}</span>);
    }
    if (token.type === "bold") {
      parts.push(<strong key={key++}>{token.content}</strong>);
    } else if (token.type === "italic") {
      parts.push(<em key={key++}>{token.content}</em>);
    } else if (token.type === "underline") {
      parts.push(<u key={key++}>{token.content}</u>);
    }
    lastIndex = token.end;
  });

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
