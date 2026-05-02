"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { formatRichText, ieltsGroupForSectionId } from "@/components/exams/shared/helpers";
import type { IeltsGroup } from "@/components/exams/shared/types";
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

const GROUP_TIME_SECONDS: Record<IeltsGroup, number> = {
  listening: 30 * 60,
  reading: 60 * 60,
  writing: 60 * 60,
  speaking: 30 * 60,
};

const GROUP_ORDER: IeltsGroup[] = ["listening", "reading", "writing", "speaking"];

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

/** Short pill label: listening_s1 → p1, reading_p2 → p2, writing_t1 → p1, speaking_p3 → p3 */
function partShortLabel(sectionId: string): string {
  const listen = sectionId.match(/^listening_s(\d+)$/i);
  if (listen) return `p${listen[1]}`;
  const read = sectionId.match(/^reading_(p\d+)$/i);
  if (read) return read[1].toLowerCase();
  const write = sectionId.match(/^writing_t(\d+)$/i);
  if (write) return `p${write[1]}`;
  const speak = sectionId.match(/^speaking_(p\d+)$/i);
  if (speak) return speak[1].toLowerCase();
  return sectionId;
}

const LEGACY_SINGLE_SECTION_ID = "__ielts_all__";

/** Drill mode uses a single section id per skill (e.g. `listening`). */
function partButtonLabel(sectionId: string, partsInGroup: number): string {
  if (sectionId === LEGACY_SINGLE_SECTION_ID) return "All";
  if (partsInGroup === 1) {
    const g = ieltsGroupForSectionId(sectionId);
    if (g && sectionId === g) return "All";
  }
  return partShortLabel(sectionId);
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function groupTitle(g: IeltsGroup): string {
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

export default function IeltsAssignmentPage() {
  const params = useParams();
  const assignmentId = typeof params?.id === "string" ? params.id : "";
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [currentSectionId, setCurrentSectionId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(GROUP_TIME_SECONDS.listening);
  const [timerPaused, setTimerPaused] = useState(false);
  const lastGroupRef = useRef<IeltsGroup | null>(null);

  const answersById = useMemo(() => {
    return new Map((attempt?.answers ?? []).map((a) => [a.questionId, a.value]));
  }, [attempt]);

  const isIelts = assignment?.exam.program === "ielts";

  /** API must send `exam.structure`; if missing (old data), one synthetic section lists every question. */
  const sections = useMemo(() => {
    if (!assignment) return [];
    const fromStructure = assignment.exam.structure?.sections;
    if (fromStructure && fromStructure.length > 0) return fromStructure;
    if ((assignment.exam.questions ?? []).length > 0) {
      return [{ id: LEGACY_SINGLE_SECTION_ID, label: "All questions", kind: "ielts_reading" }];
    }
    return [];
  }, [assignment]);

  const questionsBySection = useMemo(() => {
    if (!assignment) return {} as Record<string, ExamQuestion[]>;
    const grouped: Record<string, ExamQuestion[]> = {};
    for (const s of sections) grouped[s.id] = [];
    if (sections.length === 1 && sections[0].id === LEGACY_SINGLE_SECTION_ID) {
      grouped[LEGACY_SINGLE_SECTION_ID] = [...assignment.exam.questions];
      return grouped;
    }
    const fallback = sections[0]?.id ?? "";
    for (const q of assignment.exam.questions) {
      const sid = q.sectionId ?? fallback;
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(q);
    }
    return grouped;
  }, [assignment, sections]);

  const sectionByGroup = useMemo(() => {
    const map = new Map<IeltsGroup, typeof sections>();
    if (sections.length === 1 && sections[0].id === LEGACY_SINGLE_SECTION_ID) {
      map.set("reading", sections);
      return map;
    }
    for (const g of GROUP_ORDER) {
      const secs = sections.filter((s) => ieltsGroupForSectionId(s.id) === g);
      if (secs.length) map.set(g, secs);
    }
    return map;
  }, [sections]);

  const orderedQuestions = useMemo(() => {
    const out: { q: ExamQuestion; globalN: number; sectionId: string }[] = [];
    let n = 0;
    for (const s of sections) {
      for (const q of questionsBySection[s.id] ?? []) {
        n += 1;
        out.push({ q, globalN: n, sectionId: s.id });
      }
    }
    return out;
  }, [sections, questionsBySection]);

  const currentGroup = useMemo((): IeltsGroup | null => {
    if (currentSectionId === LEGACY_SINGLE_SECTION_ID) return "reading";
    return ieltsGroupForSectionId(currentSectionId);
  }, [currentSectionId]);

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

    const secs = data.assignment.exam.structure?.sections ?? [];
    if (secs.length) {
      setCurrentSectionId(secs[0].id);
      const g0 = ieltsGroupForSectionId(secs[0].id);
      if (g0) {
        lastGroupRef.current = g0;
        setTimeLeft(GROUP_TIME_SECONDS[g0]);
      }
    } else if ((data.assignment.exam.questions ?? []).length > 0) {
      setCurrentSectionId(LEGACY_SINGLE_SECTION_ID);
      lastGroupRef.current = "reading";
      setTimeLeft(GROUP_TIME_SECONDS.reading);
    }
  }

  useEffect(() => {
    if (!assignmentId) return;
    void loadAll().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  // Reset timer allocation when switching main skill (Listening → Reading, etc.)
  useEffect(() => {
    const g = currentGroup;
    if (!g) return;
    if (lastGroupRef.current !== g) {
      lastGroupRef.current = g;
      setTimeLeft(GROUP_TIME_SECONDS[g]);
      setTimerPaused(false);
    }
  }, [currentGroup]);

  const timerHeading = useMemo(() => {
    if (currentSectionId === LEGACY_SINGLE_SECTION_ID) return "Exam";
    if (currentGroup) return groupTitle(currentGroup);
    return "Timer";
  }, [currentSectionId, currentGroup]);

  useEffect(() => {
    if (timerPaused || attempt?.submittedAt) return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timerPaused, timeLeft, attempt?.submittedAt]);

  const scrollToGlobal = useCallback((globalN: number) => {
    const el = document.getElementById(`ielts-q-${globalN}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAttempt((prev) => {
      if (!prev) return prev;
      const next = prev.answers.filter((a) => a.questionId !== questionId);
      next.push({ questionId, value });
      return { ...prev, answers: next };
    });
  }, []);

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
      setTimerPaused(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  if (!assignment || !attempt) {
    return (
      <RoleGuard allow={["student"]}>
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted)]">Loading…</div>
      </RoleGuard>
    );
  }

  if (!isIelts) {
    if (typeof window !== "undefined") {
      window.location.href = `/dashboard/assignments/${assignmentId}`;
    }
    return null;
  }

  const submitted = Boolean(attempt.submittedAt);
  const timerLabel = `${timerHeading} · ${formatHms(timeLeft)}`;

  return (
    <RoleGuard allow={["student"]}>
      <div className="flex h-dvh min-h-0 flex-col">
        {/* Top strip */}
        <header className="z-30 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="min-w-0">
            <Link
              href="/dashboard/my-exams"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              ← Exams
            </Link>
            <h1 className="mt-1 truncate text-base font-semibold text-[var(--text)] sm:text-lg">{assignment.title}</h1>
            <p className="truncate text-xs text-[var(--muted)]">{assignment.exam.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submitted}
              onClick={() => setTimerPaused((p) => !p)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)] disabled:opacity-50"
            >
              {timerPaused ? "Resume timer" : "Pause timer"}
            </button>
            <button
              type="button"
              disabled={busy || submitted}
              onClick={() => void saveProgress()}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy || submitted}
              onClick={() => void submit()}
              className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </header>

        {error ? (
          <div className="shrink-0 border-b border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-2 text-sm text-[var(--error-text)]">
            {error}
          </div>
        ) : null}

        {submitted ? (
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-center text-xs font-semibold text-[var(--accent)]">
            Submitted — you can review your answers below.
          </div>
        ) : null}

        {/* Questions (global order); scroll above bottom bar */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[11rem] sm:pb-[9.5rem]">
          <div className="mx-auto max-w-3xl space-y-6">
            {orderedQuestions.length === 0 ? (
              <p className="text-center text-sm text-[var(--muted)]">No questions in this exam.</p>
            ) : null}
            {orderedQuestions.map(({ q, globalN, sectionId }) => {
              const current = answersById.get(q.id);
              const inSection = sectionId === currentSectionId;
              return (
                <div
                  key={q.id}
                  id={`ielts-q-${globalN}`}
                  className={`scroll-mt-4 rounded-2xl border bg-[var(--surface)] p-5 shadow-sm ${
                    inSection ? "border-[var(--accent)]/50 ring-1 ring-[var(--accent)]/20" : "border-[var(--border)]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                    Question {globalN} · {q.type} · {q.points} pts
                  </p>
                  {q.description ? (
                    <div className="mt-2 whitespace-pre-wrap border-l-2 border-[var(--border)] pl-2 text-xs font-medium italic text-[var(--muted)]">
                      {formatRichText(q.description)}
                    </div>
                  ) : null}
                  {q.type !== "rich_text" && "prompt" in q ? (
                    <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                      {formatRichText(q.prompt)}
                    </div>
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
                            disabled={submitted}
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
                      disabled={submitted}
                    />
                  ) : null}

                  {q.type === "numeric" ? (
                    <input
                      className="mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                      type="number"
                      value={typeof current === "number" ? current : current ? Number(current) : ""}
                      onChange={(e) => setAnswer(q.id, e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      disabled={submitted}
                    />
                  ) : null}

                  {q.type === "writing" ? (
                    <textarea
                      className="mt-4 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                      value={typeof current === "string" ? current : String(current ?? "")}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Write your response…"
                      disabled={submitted}
                    />
                  ) : null}

                  {q.type === "html_interactive" ? (
                    <p className="mt-4 text-sm text-[var(--muted)]">
                      HTML questions are not supported in this view yet. Use the standard assignment page if needed.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom bar: sections | question # | timer */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-h-[42vh] w-full max-w-[100rem] flex-col gap-3 overflow-y-auto px-3 py-3 sm:max-h-none sm:flex-row sm:items-stretch sm:gap-4 sm:px-4">
            {/* Left: skill rows + part pills */}
            <div className="min-w-0 flex-1 space-y-2 border-[var(--border)] sm:border-r sm:pr-4">
              {GROUP_ORDER.map((g) => {
                const secs = sectionByGroup.get(g);
                if (!secs?.length) return null;
                return (
                  <div key={g} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--faint)] sm:text-xs">
                      {groupTitle(g)}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {secs.map((s) => {
                        const active = s.id === currentSectionId;
                        const count = questionsBySection[s.id]?.length ?? 0;
                        const done = questionsBySection[s.id]?.filter((qq) => answersById.has(qq.id)).length ?? 0;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            title={s.label}
                            onClick={() => {
                              setCurrentSectionId(s.id);
                              const first = orderedQuestions.find((o) => o.sectionId === s.id);
                              if (first) scrollToGlobal(first.globalN);
                            }}
                            className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition sm:text-xs ${
                              active
                                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                                : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:bg-[var(--hover)]"
                            }`}
                          >
                            {partButtonLabel(s.id, secs.length)}
                            <span className="ml-1 opacity-70">({done}/{count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Middle: question numbers */}
            <div className="flex shrink-0 flex-col justify-center border-[var(--border)] sm:border-r sm:px-3">
              <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">
                Questions
              </p>
              <div className="flex max-w-[min(100vw,28rem)] flex-wrap justify-center gap-1 sm:max-w-[20rem]">
                {orderedQuestions.map(({ q, globalN, sectionId }) => {
                  const answered = answersById.has(q.id);
                  const activePart = sectionId === currentSectionId;
                  return (
                    <button
                      key={globalN}
                      type="button"
                      onClick={() => {
                        setCurrentSectionId(sectionId);
                        scrollToGlobal(globalN);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold ${
                        answered
                          ? "border-emerald-600/40 bg-emerald-600/15 text-emerald-800 dark:text-emerald-200"
                          : "border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                      } ${activePart ? "ring-1 ring-[var(--accent)]/40" : ""}`}
                    >
                      {globalN}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: timer */}
            <div className="flex shrink-0 flex-col justify-center sm:w-52">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">Timer</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Listening 30m · Reading 60m · Writing 60m · Speaking 30m
              </p>
              <p
                className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
                  timeLeft > 0 && timeLeft < 300 ? "text-red-600" : "text-[var(--text)]"
                }`}
              >
                {timerLabel}
              </p>
              {timeLeft === 0 && !submitted ? (
                <p className="mt-1 text-[11px] font-semibold text-red-600">Time is up for this section.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
