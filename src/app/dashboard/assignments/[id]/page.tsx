"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { choiceDisplayText, normalizeExamChoices } from "@/lib/exams/choices";
import type { ExamQuestion } from "@/lib/exams/types";

type Assignment = {
  id: string;
  title: string;
  dueAt: string | null;
  exam: {
    id: string;
    title: string;
    program: string;
    mode: string;
    questions: ExamQuestion[];
  };
};

type Attempt = {
  id: string;
  submittedAt: string | null;
  answers: Array<{ questionId: string; value: unknown }>;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManual: boolean;
  status: string;
  breakdown: Array<{ questionId: string; points: number; earned: number; auto: boolean }>;
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

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = typeof params?.id === "string" ? params.id : "";
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const answersById = useMemo(() => {
    return new Map((attempt?.answers ?? []).map((a) => [a.questionId, a.value]));
  }, [attempt]);

  async function loadAll() {
    setError(null);
    const data = await api<{ assignment: Assignment }>(`/api/assignments/${assignmentId}`);
    setAssignment(data.assignment);

    const started = await api<{ attemptId: string }>("/api/attempts/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    setAttemptId(started.attemptId);

    const attemptData = await api<{ attempt: Attempt }>(`/api/attempts/${started.attemptId}`);
    setAttempt(attemptData.attempt);
  }

  useEffect(() => {
    if (!assignmentId) return;
    void loadAll().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  function setAnswer(questionId: string, value: unknown) {
    setAttempt((prev) => {
      if (!prev) return prev;
      const next = prev.answers.filter((a) => a.questionId !== questionId);
      next.push({ questionId, value });
      return { ...prev, answers: next };
    });
  }

  async function saveProgress() {
    if (!attemptId || !attempt) return;
    setError(null);
    setBusy(true);
    try {
      const data = await api<{ attempt: Attempt }>(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: attempt.answers }),
      });
      setAttempt((prev) => (prev ? { ...prev, ...data.attempt } : data.attempt));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!attemptId || !attempt) return;
    const ok = window.confirm("Submit now? After submission you can’t change answers.");
    if (!ok) return;
    setError(null);
    setBusy(true);
    try {
      const data = await api<{ attempt: Attempt }>(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: attempt.answers, submit: true }),
      });
      setAttempt(data.attempt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  const totalPoints = useMemo(() => {
    return (assignment?.exam.questions ?? []).reduce((sum, q) => sum + q.points, 0);
  }, [assignment]);

  return (
    <RoleGuard allow={["student"]}>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/dashboard/assignments" className="text-sm font-medium text-[var(--accent)] hover:underline">
              ← Assignments
            </Link>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-[var(--text)]">
              {assignment?.title ?? "Loading…"}
            </h1>
            {assignment ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {assignment.exam.title} · {assignment.exam.program}/{assignment.exam.mode} · {assignment.exam.questions.length} questions · {totalPoints} pts
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || !attempt || Boolean(attempt.submittedAt)}
              onClick={() => void saveProgress()}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy || !attempt || Boolean(attempt.submittedAt)}
              onClick={() => void submit()}
              className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              Submit
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        {attempt?.submittedAt ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <p className="text-sm font-semibold text-[var(--text)]">Submitted</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Auto score: <span className="font-semibold text-[var(--text)]">{attempt.autoScore}</span> / {totalPoints}
              {attempt.needsManual ? " · Waiting for manual grading" : ""}
            </p>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {(assignment?.exam.questions ?? []).map((q, idx) => {
            const current = answersById.get(q.id);
            return (
              <div key={q.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                  Q{idx + 1} · {q.type} · {q.points} pts
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
                    className="mt-3 max-h-64 w-auto max-w-full rounded-lg border border-[var(--border)] object-contain"
                  />
                ) : null}

                {q.type === "mcq_single" ? (
                  <div className="mt-4 space-y-2">
                    {normalizeExamChoices(q.choices as unknown).map((c, i) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          checked={Number(current) === i}
                          onChange={() => setAnswer(q.id, i)}
                        />
                        <span className="min-w-0 flex-1 text-sm text-[var(--text)]">
                          <span className="block">{choiceDisplayText(c)}</span>
                          {c.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt=""
                              className="mt-2 max-h-40 w-auto max-w-full rounded-md border border-[var(--border)] object-contain"
                            />
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}

                {q.type === "short_text" ? (
                  <input
                    className="mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                    value={typeof current === "string" ? current : String(current ?? "")}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your answer…"
                  />
                ) : null}

                {q.type === "numeric" ? (
                  <input
                    className="mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                    type="number"
                    value={typeof current === "number" ? current : current ? Number(current) : ""}
                    onChange={(e) => setAnswer(q.id, e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                  />
                ) : null}

                {q.type === "writing" ? (
                  <textarea
                    className="mt-4 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                    value={typeof current === "string" ? current : String(current ?? "")}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Write your response…"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-[var(--faint)]">
          Tip: click Save anytime. Submit will run auto-grading immediately for objective questions.
        </p>
      </div>
    </RoleGuard>
  );
}

