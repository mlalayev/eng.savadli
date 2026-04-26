"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import type { ExamQuestion } from "@/lib/exams/types";

type Attempt = {
  id: string;
  examId: string;
  studentId: string;
  submittedAt: string | null;
  answers: Array<{ questionId: string; value: unknown }>;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManual: boolean;
  status: string;
  breakdown: Array<{ questionId: string; points: number; earned: number; auto: boolean }>;
};

type Exam = {
  id: string;
  title: string;
  questions: ExamQuestion[];
};

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

function formatRichTextSimple(content: string): React.ReactNode {
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

  return parts.length > 0 ? parts : content;
}

export default function GradeAttemptPage() {
  const params = useParams();
  const attemptId = typeof params?.id === "string" ? params.id : "";
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byQ = useMemo(() => new Map((attempt?.answers ?? []).map((a) => [a.questionId, a.value])), [attempt]);

  const manualQuestions = useMemo(() => {
    return (exam?.questions ?? []).filter((q) => q.type === "writing" || q.type === "rich_text");
  }, [exam]);

  const [grades, setGrades] = useState<Record<string, { earned: number; feedback: string }>>({});

  useEffect(() => {
    if (!attemptId) return;
    queueMicrotask(() => {
      void (async () => {
        setError(null);
        const a = await api<{ attempt: Attempt }>(`/api/attempts/${attemptId}`);
        setAttempt(a.attempt);
        const ex = await api<{ exam: { id: string; title: string; questions: ExamQuestion[] } }>(
          `/api/exams/${a.attempt.examId}`,
        );
        setExam(ex.exam);
      })().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    });
  }, [attemptId]);

  useEffect(() => {
    if (!exam) return;
    setGrades((prev) => {
      const next = { ...prev };
      for (const q of exam.questions) {
        if (q.type !== "writing" && q.type !== "rich_text") continue;
        if (!next[q.id]) next[q.id] = { earned: 0, feedback: "" };
      }
      return next;
    });
  }, [exam]);

  async function submitGrades() {
    if (!attempt) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        grades: manualQuestions.map((q) => ({
          questionId: q.id,
          earned: Number(grades[q.id]?.earned ?? 0),
          feedback: grades[q.id]?.feedback?.trim() || undefined,
        })),
      };
      await api(`/api/attempts/${attempt.id}/grade`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      window.alert("Grades saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to grade");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div>
        <Link href="/dashboard/gradebook" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Gradebook
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">Grade attempt</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {exam?.title ?? "Loading…"} · Auto {attempt?.autoScore ?? "—"} · Manual {attempt?.manualScore ?? "—"} · Total{" "}
          {attempt?.totalScore ?? "—"}
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">Manual questions</h2>
            <button
              type="button"
              disabled={busy || manualQuestions.length === 0}
              onClick={() => void submitGrades()}
              className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              Save grades
            </button>
          </div>

          {manualQuestions.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">This attempt has no manual questions.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {manualQuestions.map((q) => {
                const answer = byQ.get(q.id);
                const g = grades[q.id] ?? { earned: 0, feedback: "" };
                return (
                  <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                      {q.type} · {q.points} pts
                    </p>
                    {q.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs font-medium text-[var(--muted)] italic border-l-2 border-[var(--border)] pl-2">
                        {q.description}
                      </p>
                    ) : null}
                    {q.type !== "rich_text" && "prompt" in q ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">{q.prompt}</p>
                    ) : null}
                    {q.type === "rich_text" && "content" in q ? (
                      <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                        {formatRichTextSimple(q.content)}
                      </div>
                    ) : null}
                    {"promptImageUrl" in q && q.promptImageUrl ? (
                      <img
                        src={q.promptImageUrl}
                        alt=""
                        className="mt-2 max-h-48 w-auto max-w-full rounded-lg border border-[var(--border)] object-contain"
                      />
                    ) : null}
                    <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                      <p className="text-xs font-semibold text-[var(--faint)]">Student answer</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">
                        {typeof answer === "string" ? answer : JSON.stringify(answer)}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="text-sm font-medium text-[var(--text)]">
                        Earned points
                        <input
                          className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                          type="number"
                          min={0}
                          max={q.points}
                          value={g.earned}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [q.id]: { ...g, earned: Number(e.target.value) },
                            }))
                          }
                        />
                      </label>
                      <label className="text-sm font-medium text-[var(--text)] sm:col-span-2">
                        Feedback (optional)
                        <input
                          className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                          value={g.feedback}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [q.id]: { ...g, feedback: e.target.value },
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}

