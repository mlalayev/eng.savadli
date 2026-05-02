"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { formatRichText } from "@/components/exams/shared/helpers";
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
    structure?: {
      sections?: Array<{ id: string; label: string; kind: string }>;
    };
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

export default function IeltsAssignmentPage() {
  const params = useParams();
  const assignmentId = typeof params?.id === "string" ? params.id : "";
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // IELTS-specific state
  const [currentSectionId, setCurrentSectionId] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // seconds
  const [timerActive, setTimerActive] = useState(false);

  const answersById = useMemo(() => {
    return new Map((attempt?.answers ?? []).map((a) => [a.questionId, a.value]));
  }, [attempt]);

  const isIelts = assignment?.exam.program === "ielts";
  const sections = assignment?.exam.structure?.sections ?? [];

  const questionsBySection = useMemo(() => {
    if (!isIelts || sections.length === 0) return { all: assignment?.exam.questions ?? [] };
    const grouped: Record<string, ExamQuestion[]> = {};
    for (const s of sections) grouped[s.id] = [];
    for (const q of assignment?.exam.questions ?? []) {
      const sid = q.sectionId ?? sections[0]?.id ?? "all";
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(q);
    }
    return grouped;
  }, [assignment, isIelts, sections]);

  const currentQuestions = isIelts && currentSectionId ? questionsBySection[currentSectionId] ?? [] : assignment?.exam.questions ?? [];

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

    // Auto-select first section for IELTS
    if (data.assignment.exam.program === "ielts" && data.assignment.exam.structure?.sections?.length) {
      setCurrentSectionId(data.assignment.exam.structure.sections[0].id);
    }
  }

  useEffect(() => {
    if (!assignmentId) return;
    void loadAll().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  // Timer logic
  useEffect(() => {
    if (!timerActive || timeRemaining === null || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeRemaining]);

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
    const ok = window.confirm("Submit now? After submission you can't change answers.");
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
      setTimerActive(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  const totalPoints = useMemo(() => {
    return (assignment?.exam.questions ?? []).reduce((sum, q) => sum + q.points, 0);
  }, [assignment]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!assignment || !attempt) {
    return (
      <RoleGuard allow={["student"]}>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      </RoleGuard>
    );
  }

  if (!isIelts) {
    // Redirect to standard assignment page for non-IELTS exams
    if (typeof window !== "undefined") {
      window.location.href = `/dashboard/assignments/${assignmentId}`;
    }
    return null;
  }

  return (
    <RoleGuard allow={["student"]}>
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        {/* Top Bar */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-[var(--text)]">{assignment.title}</h1>
              <p className="text-xs text-[var(--muted)]">{assignment.exam.title}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Timer */}
              {timeRemaining !== null ? (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5">
                  <span className="text-xs font-semibold text-[var(--muted)]">Time:</span>
                  <span className={`font-mono text-sm font-bold ${timeRemaining < 300 ? "text-red-500" : "text-[var(--text)]"}`}>
                    {formatTime(timeRemaining)}
                  </span>
                  {!timerActive && timeRemaining > 0 ? (
                    <button
                      type="button"
                      onClick={() => setTimerActive(true)}
                      className="ml-2 text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Start
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTimeRemaining(7200); // 2 hours default
                    setTimerActive(true);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
                >
                  Start Timer
                </button>
              )}

              <button
                type="button"
                disabled={busy || Boolean(attempt.submittedAt)}
                onClick={() => void saveProgress()}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy || Boolean(attempt.submittedAt)}
                onClick={() => void submit()}
                className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-auto mt-4 w-full max-w-7xl px-4">
            <p className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">
              {error}
            </p>
          </div>
        ) : null}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-4 pb-32">
            {currentQuestions.map((q, idx) => {
              const current = answersById.get(q.id);
              return (
                <div key={q.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                    Q{idx + 1} · {q.type} · {q.points} pts
                  </p>
                  {q.description ? (
                    <div className="mt-2 whitespace-pre-wrap text-xs font-medium italic text-[var(--muted)] border-l-2 border-[var(--border)] pl-2">
                      {formatRichText(q.description)}
                    </div>
                  ) : null}
                  {q.type !== "rich_text" && "prompt" in q ? (
                    <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">{formatRichText(q.prompt)}</div>
                  ) : null}
                  {q.type === "rich_text" && "content" in q ? (
                    <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                      {formatRichText(q.content)}
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
                            disabled={Boolean(attempt.submittedAt)}
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
                      disabled={Boolean(attempt.submittedAt)}
                    />
                  ) : null}

                  {q.type === "numeric" ? (
                    <input
                      className="mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                      type="number"
                      value={typeof current === "number" ? current : current ? Number(current) : ""}
                      onChange={(e) => setAnswer(q.id, e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      disabled={Boolean(attempt.submittedAt)}
                    />
                  ) : null}

                  {q.type === "writing" ? (
                    <textarea
                      className="mt-4 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                      value={typeof current === "string" ? current : String(current ?? "")}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Write your response…"
                      disabled={Boolean(attempt.submittedAt)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section Bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--surface)] shadow-lg">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3">
            <div className="flex items-center gap-2">
              {sections.map((s) => {
                const count = questionsBySection[s.id]?.length ?? 0;
                const answered = questionsBySection[s.id]?.filter((q) => answersById.has(q.id)).length ?? 0;
                const isActive = currentSectionId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSectionId(s.id)}
                    className={`flex shrink-0 flex-col items-center gap-1 rounded-lg border px-4 py-2 transition ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-[10px] opacity-75">
                      {answered}/{count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
