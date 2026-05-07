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
    structure?: {
      sections?: Array<{ id: string; label: string; kind: string }>;
      passagesBySection?: Record<string, Array<{ id: string; intros?: string[]; text?: string[] }>>;
      questionPassageBySection?: Record<string, Record<string, string>>;
      timerSecondsBySection?: Record<string, number>;
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

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function DsatAssignmentPage() {
  const params = useParams();
  const assignmentId = typeof params?.id === "string" ? params.id : "";

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [leftHidden, setLeftHidden] = useState(false);

  const sections = useMemo(() => {
    const from = assignment?.exam.structure?.sections;
    if (from && from.length) return from;
    return [
      { id: "rw1", label: "Reading & Writing 1", kind: "dsat_rw_1" },
      { id: "rw2", label: "Reading & Writing 2", kind: "dsat_rw_2" },
      { id: "math1", label: "Math 1", kind: "dsat_math_1" },
      { id: "math2", label: "Math 2", kind: "dsat_math_2" },
    ];
  }, [assignment]);

  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id ?? "rw1");

  const questionsBySection = useMemo(() => {
    const grouped: Record<string, ExamQuestion[]> = {};
    for (const s of sections) grouped[s.id] = [];
    const fallback = sections[0]?.id ?? "rw1";
    for (const q of assignment?.exam.questions ?? []) {
      const sid = q.sectionId ?? fallback;
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(q);
    }
    return grouped;
  }, [assignment, sections]);

  const sectionQuestions = questionsBySection[activeSectionId] ?? [];

  const timerSeed =
    assignment?.exam.structure?.timerSecondsBySection?.[activeSectionId] ??
    (activeSectionId === "math1" || activeSectionId === "math2" ? 35 * 60 : 32 * 60);
  const [remaining, setRemaining] = useState<number>(timerSeed);

  const answersById = useMemo(() => new Map((attempt?.answers ?? []).map((a) => [a.questionId, a.value])), [attempt]);

  useEffect(() => {
    setRemaining(timerSeed);
  }, [timerSeed, activeSectionId]);

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

  useEffect(() => {
    if (attempt?.submittedAt) return;
    const t = window.setInterval(() => setRemaining((prev) => (prev <= 0 ? 0 : prev - 1)), 1000);
    return () => window.clearInterval(t);
  }, [attempt?.submittedAt]);

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

  function setAnswer(questionId: string, value: unknown) {
    setAttempt((prev) => {
      if (!prev) return prev;
      const next = prev.answers.filter((a) => a.questionId !== questionId);
      next.push({ questionId, value });
      return { ...prev, answers: next };
    });
  }

  const questions = assignment?.exam.questions ?? [];
  const activeQuestion = sectionQuestions[Math.min(activeIndex, Math.max(0, sectionQuestions.length - 1))];

  const passageId =
    assignment?.exam.structure?.questionPassageBySection?.[activeSectionId]?.[activeQuestion?.id ?? ""] ?? "";
  const activePassage =
    (assignment?.exam.structure?.passagesBySection?.[activeSectionId] ?? []).find((p) => p.id === passageId) ??
    (assignment?.exam.structure?.passagesBySection?.[activeSectionId] ?? [])[0] ??
    null;

  const selectedIndex = activeQuestion ? answersById.get(activeQuestion.id) : undefined;

  const answeredCount = useMemo(
    () => sectionQuestions.filter((q) => answersById.has(q.id)).length,
    [sectionQuestions, answersById],
  );

  function goto(delta: number) {
    setActiveIndex((i) => {
      const next = i + delta;
      if (next < 0) return 0;
      if (next >= sectionQuestions.length) return Math.max(0, sectionQuestions.length - 1);
      return next;
    });
  }

  if (!assignment || !attempt || !activeQuestion) {
    return (
      <RoleGuard allow={["student"]}>
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted)]">Loading…</div>
      </RoleGuard>
    );
  }

  const submitted = Boolean(attempt.submittedAt);

  return (
    <RoleGuard allow={["student"]}>
      <div className="min-h-[calc(100vh-56px)] bg-[var(--background)]">
        {error ? (
          <div className="border-b border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-2 text-sm text-[var(--error-text)]">
            {error}
          </div>
        ) : null}

        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/dashboard/assignments"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
            >
              ← Exams
            </Link>

            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] sm:inline-flex">
                Module
                <select
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-semibold"
                  value={activeSectionId}
                  onChange={(e) => {
                    setActiveSectionId(e.target.value);
                    setActiveIndex(0);
                  }}
                  disabled={submitted}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-lg font-semibold tabular-nums text-[var(--text)]">{formatTime(remaining)}</span>
              <button
                type="button"
                onClick={() => setLeftHidden((v) => !v)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
              >
                {leftHidden ? "Show" : "Hide"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void saveProgress()}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)] disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void submit()}
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                Submit
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-0 px-4 py-4 lg:grid-cols-2">
          {!leftHidden ? (
            <section className="min-h-[70vh] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm lg:rounded-r-none lg:border-r-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                    {assignment.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{assignment.exam.title}</p>
                </div>
                <div className="text-xs font-semibold text-[var(--muted)]">
                  {answeredCount}/{sectionQuestions.length} answered
                </div>
              </div>

              <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--text)]">
                {activeSectionId.startsWith("math") ? (
                  <div className="space-y-3">
                    <p className="font-medium text-[var(--muted)]">Directions</p>
                    <p className="whitespace-pre-wrap text-sm text-[var(--text)]">
                      Solve each problem and select the best answer choice.
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      (Reference sheet / calculator panel can be added here next.)
                    </p>
                  </div>
                ) : activePassage?.intros?.length ? (
                  <div className="space-y-2">
                    {activePassage.intros.map((line, idx) => (
                      <p key={`${activePassage.id}_intro_${idx}`} className="font-medium text-[var(--muted)]">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                {!activeSectionId.startsWith("math") && activePassage?.text?.length ? (
                  <div className="space-y-3">
                    {activePassage.text.map((para, idx) => (
                      <p key={`${activePassage.id}_text_${idx}`} className="whitespace-pre-wrap">
                        {para}
                      </p>
                    ))}
                  </div>
                ) : !activeSectionId.startsWith("math") ? (
                  <p className="text-[var(--muted)]">No passage configured for this question.</p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section
            className={`min-h-[70vh] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm ${
              leftHidden ? "" : "lg:rounded-l-none"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--hover-strong)] text-xs font-bold text-[var(--text)]">
                  {activeIndex + 1}
                </span>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={Boolean(marked[activeQuestion.id])}
                    onChange={(e) => setMarked((m) => ({ ...m, [activeQuestion.id]: e.target.checked }))}
                    disabled={submitted}
                  />
                  Mark for Review
                </label>
              </div>
              <div className="text-xs font-semibold text-[var(--muted)] tabular-nums">
                {activeIndex + 1} / {sectionQuestions.length}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[var(--text)]">
                {"prompt" in activeQuestion ? activeQuestion.prompt : ""}
              </p>

              {activeQuestion.type === "mcq_single" ? (
                <div className="mt-4 space-y-2">
                  {normalizeExamChoices(activeQuestion.choices as unknown).map((c, idx) => {
                    const checked = Number(selectedIndex) === idx;
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswer(activeQuestion.id, idx)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                          checked
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:bg-[var(--hover)]"
                        } ${submitted ? "opacity-90" : ""}`}
                      >
                        <span className="flex min-w-0 items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                              checked
                                ? "bg-[var(--accent)] text-[var(--on-accent)]"
                                : "bg-[var(--hover-strong)] text-[var(--text)]"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="min-w-0">{choiceDisplayText(c)}</span>
                        </span>
                        <span className="text-xs font-semibold text-[var(--muted)]">{checked ? "✓" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[var(--muted)]">This DSAT view currently supports MCQ only.</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => goto(-1)}
                disabled={activeIndex === 0}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--hover)] disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => goto(1)}
                disabled={activeIndex === questions.length - 1}
                className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        </main>
      </div>
    </RoleGuard>
  );
}

