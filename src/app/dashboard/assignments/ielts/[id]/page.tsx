"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ListeningAudioPanel } from "@/components/dashboard/ListeningAudioPanel";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { HtmlInteractiveRunner, parseHtmlInteractiveStored } from "@/components/exams/HtmlInteractiveRunner";
import { formatRichText, ieltsGroupForSectionId } from "@/components/exams/shared/helpers";
import { IELTS_LISTENING_AUDIO_KEY, type IeltsGroup, type IeltsMaterialsMap } from "@/components/exams/shared/types";
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
      materials?: IeltsMaterialsMap;
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

type QuestionAppearance = "default" | "listening";

type IeltsPartQuestionsProps = {
  questions: ExamQuestion[];
  sectionId: string;
  answersById: Map<string, unknown>;
  attemptAnswers: Array<{ questionId: string; value: unknown }>;
  setAnswer: (questionId: string, value: unknown) => void;
  submitted: boolean;
  appearance?: QuestionAppearance;
};

function IeltsPartQuestions({
  questions,
  sectionId,
  answersById,
  attemptAnswers,
  setAnswer,
  submitted,
  appearance = "default",
}: IeltsPartQuestionsProps) {
  if (questions.length === 0) {
    return <p className="text-center text-sm text-[var(--muted)]">No questions in this part.</p>;
  }
  return (
    <>
      {questions.map((q, i) => (
        <IeltsQuestionCard
          key={q.id}
          q={q}
          sectionId={sectionId}
          localN={i + 1}
          answersById={answersById}
          attemptAnswers={attemptAnswers}
          setAnswer={setAnswer}
          submitted={submitted}
          appearance={appearance}
        />
      ))}
    </>
  );
}

function IeltsQuestionCard({
  q,
  sectionId,
  localN,
  answersById,
  attemptAnswers,
  setAnswer,
  submitted,
  appearance = "default",
}: {
  q: ExamQuestion;
  sectionId: string;
  localN: number;
  answersById: Map<string, unknown>;
  attemptAnswers: Array<{ questionId: string; value: unknown }>;
  setAnswer: (questionId: string, value: unknown) => void;
  submitted: boolean;
  appearance?: QuestionAppearance;
}) {
  const current = answersById.get(q.id);
  const htmlStoredJson = useMemo(() => {
    const raw = attemptAnswers.find((a) => a.questionId === q.id)?.value;
    return JSON.stringify(parseHtmlInteractiveStored(raw));
  }, [attemptAnswers, q.id]);

  const cardShell =
    appearance === "listening"
      ? "scroll-mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--shadow-ring)]"
      : "scroll-mt-4 rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--accent)]/15";

  const choiceRow =
    appearance === "listening"
      ? "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 transition hover:border-[var(--accent)]/35 hover:bg-[var(--hover)] has-[:checked]:border-[var(--accent)]/50 has-[:checked]:bg-[var(--accent-soft)]"
      : "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3";

  return (
    <div id={`ielts-q-${sectionId}-${localN}`} className={cardShell}>
      <p
        className={
          appearance === "listening"
            ? "text-xs font-semibold uppercase tracking-wider text-[var(--accent)]"
            : "text-xs font-semibold uppercase tracking-wider text-[var(--faint)]"
        }
      >
        {appearance === "listening" ? (
          <>
            Question <span className="text-[var(--text)]">{localN}</span>
            <span className="font-normal text-[var(--faint)]"> · {q.points} pts</span>
          </>
        ) : (
          <>
            Question {localN} · {q.type} · {q.points} pts
          </>
        )}
      </p>
      {q.description ? (
        <div className="mt-2 whitespace-pre-wrap border-l-2 border-[var(--border)] pl-2 text-xs font-medium italic text-[var(--muted)]">
          {formatRichText(q.description)}
        </div>
      ) : null}
      {q.type !== "rich_text" && "prompt" in q ? (
        <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">{formatRichText(q.prompt)}</div>
      ) : null}
      {q.type === "rich_text" && "content" in q ? (
        <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">{formatRichText(q.content)}</div>
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
            <label key={c.id} className={choiceRow}>
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
          className={`mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm ${
            appearance === "listening" ? "focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/15" : ""
          }`}
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
        <HtmlInteractiveRunner
          questionId={q.id}
          htmlContent={q.htmlContent}
          cssContent={q.cssContent}
          disabled={submitted}
          storedAnswersJson={htmlStoredJson}
          onValuesChange={(answers) => setAnswer(q.id, answers)}
        />
      ) : null}
    </div>
  );
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

  const ieltsMaterials = useMemo((): IeltsMaterialsMap => {
    const s = assignment?.exam.structure as { materials?: IeltsMaterialsMap } | undefined;
    return s?.materials ?? {};
  }, [assignment]);

  const listeningAudioUrl = ieltsMaterials[IELTS_LISTENING_AUDIO_KEY]?.audioUrl?.trim() ?? "";

  const currentSectionLabel = sections.find((s) => s.id === currentSectionId)?.label?.trim() ?? "";

  const currentSectionQuestions = useMemo(
    () => questionsBySection[currentSectionId] ?? [],
    [questionsBySection, currentSectionId],
  );

  const currentSectionMaterialText = ieltsMaterials[currentSectionId]?.text?.trim() ?? "";

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

  const scrollToQuestionInSection = useCallback((sectionId: string, localN: number) => {
    const el = document.getElementById(`ielts-q-${sectionId}-${localN}`);
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

  return (
    <RoleGuard allow={["student"]}>
      <div className="flex h-dvh min-h-0 flex-col">
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

        {/* Current part only; listening uses split layout (audio | questions) */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--background)] px-4 py-5 pb-[13.5rem] sm:px-6 sm:pb-[11.5rem]">
          {currentGroup === "listening" && currentSectionId !== LEGACY_SINGLE_SECTION_ID ? (
            <div className="mx-auto grid max-w-[110rem] gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start lg:gap-8 xl:grid-cols-[minmax(300px,380px)_1fr]">
              <aside className="flex min-h-0 flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
                <ListeningAudioPanel src={listeningAudioUrl} subtitle={currentSectionLabel || undefined} />
                {currentSectionMaterialText ? (
                  <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                    <div
                      className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[var(--accent-soft)]/60 blur-2xl"
                      aria-hidden
                    />
                    <div className="relative border-b border-[var(--border)] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Materials</p>
                      <h3 className="mt-1 text-sm font-semibold text-[var(--text)]">Script and directions</h3>
                    </div>
                    <div className="relative max-h-[min(50vh,28rem)] overflow-y-auto px-5 py-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                        {formatRichText(currentSectionMaterialText)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </aside>
              <div className="min-w-0">
                <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                  <div
                    className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-3xl"
                    aria-hidden
                  />
                  <div className="relative border-b border-[var(--border)] px-5 py-4 sm:px-6 sm:py-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Your answers</p>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl">Questions</h2>
                      {currentSectionLabel ? (
                        <span className="text-sm text-[var(--muted)]">{currentSectionLabel}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="relative space-y-5 px-5 py-5 sm:space-y-6 sm:px-6 sm:pb-7">
                    <IeltsPartQuestions
                      questions={currentSectionQuestions}
                      sectionId={currentSectionId}
                      answersById={answersById}
                      attemptAnswers={attempt.answers}
                      setAnswer={setAnswer}
                      submitted={submitted}
                      appearance="listening"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              <IeltsPartQuestions
                questions={currentSectionQuestions}
                sectionId={currentSectionId}
                answersById={answersById}
                attemptAnswers={attempt.answers}
                setAnswer={setAnswer}
                submitted={submitted}
              />
            </div>
          )}
        </div>

        {/* Bottom dock: toolbar + exam nav (professional, compact) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-12px_40px_rgba(28,25,23,0.07)] supports-[backdrop-filter]:backdrop-blur-md">
          <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--border)] px-4 py-2.5 sm:px-6">
            <Link
              href="/dashboard/my-exams"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]"
            >
              <span className="text-[var(--faint)] transition group-hover:text-[var(--accent)]" aria-hidden>
                ←
              </span>
              Exams
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={submitted}
                onClick={() => setTimerPaused((p) => !p)}
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-40"
              >
                {timerPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void saveProgress()}
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void submit()}
                className="ml-1 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)] disabled:pointer-events-none disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="bg-[var(--background)]">
            <div className="mx-auto flex max-h-[38vh] max-w-[100rem] flex-col gap-4 overflow-y-auto px-4 py-3 sm:max-h-none sm:flex-row sm:items-center sm:gap-0 sm:px-6 sm:py-3.5">
              {/* Sections */}
              <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-2 sm:pr-8">
                {GROUP_ORDER.map((g) => {
                  const secs = sectionByGroup.get(g);
                  if (!secs?.length) return null;
                  return (
                    <div key={g} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                      <span className="shrink-0 text-xs font-medium text-[var(--muted)] sm:w-[4.75rem]">
                        {groupTitle(g)}
                      </span>
                      <div className="flex min-w-0 flex-wrap gap-1">
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
                                scrollToQuestionInSection(s.id, 1);
                              }}
                              className={`inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border px-2.5 text-left text-xs font-medium transition ${
                                active
                                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] shadow-sm"
                                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--muted)]/40 hover:bg-[var(--hover)]"
                              }`}
                            >
                              <span className="truncate">{partButtonLabel(s.id, secs.length)}</span>
                              <span
                                className={
                                  active ? "tabular-nums text-[var(--on-accent)]/75" : "tabular-nums text-[var(--faint)]"
                                }
                              >
                                {done}/{count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden h-14 w-px shrink-0 self-stretch bg-[var(--border)] sm:block" aria-hidden />

              {/* Questions */}
              <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-xs font-medium text-[var(--muted)]">Questions</span>
                <div className="flex max-w-[min(100vw-2rem,18rem)] flex-wrap gap-1 sm:max-w-[14rem]">
                  {currentSectionQuestions.map((q, i) => {
                    const localN = i + 1;
                    const answered = answersById.has(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => scrollToQuestionInSection(currentSectionId, localN)}
                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-xs font-semibold tabular-nums transition ${
                          answered
                            ? "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--muted)]/35"
                        }`}
                      >
                        {localN}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden h-14 w-px shrink-0 self-stretch bg-[var(--border)] sm:block" aria-hidden />

              {/* Timer */}
              <div
                className="flex shrink-0 flex-col gap-0.5 border-t border-[var(--border)] pt-3 sm:min-w-[9.5rem] sm:border-t-0 sm:pt-0"
                title="Listening 30m · Reading 60m · Writing 60m · Speaking 30m"
              >
                <span className="text-xs font-medium text-[var(--muted)]">Time</span>
                <span className="text-[11px] leading-snug text-[var(--faint)]">{timerHeading}</span>
                <span
                  className={`mt-0.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${
                    timeLeft > 0 && timeLeft < 300 ? "text-[var(--danger-text)]" : "text-[var(--text)]"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {formatHms(timeLeft)}
                </span>
                {timeLeft === 0 && !submitted ? (
                  <p className="mt-1 text-xs font-medium text-[var(--danger-text)]">Time is up for this section.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
