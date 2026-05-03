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

/** One-letter skill markers in the bottom exam rail (L / R / W / S). */
function groupRailMarker(g: IeltsGroup): string {
  switch (g) {
    case "listening":
      return "L";
    case "reading":
      return "R";
    case "writing":
      return "W";
    case "speaking":
      return "S";
    default: {
      const _x: never = g;
      return _x;
    }
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

/** Listening: one wrapper div + bare iframe(s) only (no question chrome). */
function ListeningHtmlIframeItem({
  q,
  sectionId,
  localN,
  attemptAnswers,
  setAnswer,
  submitted,
}: {
  q: ExamQuestion & { type: "html_interactive" };
  sectionId: string;
  localN: number;
  attemptAnswers: Attempt["answers"];
  setAnswer: (questionId: string, value: unknown) => void;
  submitted: boolean;
}) {
  const htmlStoredJson = useMemo(() => {
    const raw = attemptAnswers.find((a) => a.questionId === q.id)?.value;
    return JSON.stringify(parseHtmlInteractiveStored(raw));
  }, [attemptAnswers, q.id]);

  return (
    <HtmlInteractiveRunner
      questionId={q.id}
      htmlContent={q.htmlContent}
      cssContent={q.cssContent}
      disabled={submitted}
      storedAnswersJson={htmlStoredJson}
      onValuesChange={(answers) => setAnswer(q.id, answers)}
      bare
      iframeId={`ielts-q-${sectionId}-${localN}`}
    />
  );
}

function ListeningSectionRight({
  questions,
  sectionId,
  answersById,
  attemptAnswers,
  setAnswer,
  submitted,
}: {
  questions: ExamQuestion[];
  sectionId: string;
  answersById: Map<string, unknown>;
  attemptAnswers: Attempt["answers"];
  setAnswer: (questionId: string, value: unknown) => void;
  submitted: boolean;
}) {
  const allHtmlInteractive =
    questions.length > 0 && questions.every((q) => q.type === "html_interactive");

  if (questions.length === 0) {
    return (
      <div className="min-h-0 w-full min-w-0">
        <p className="text-center text-sm text-[var(--muted)]">No questions in this part.</p>
      </div>
    );
  }

  if (!allHtmlInteractive) {
    return (
      <div className="min-h-0 w-full min-w-0 space-y-5">
        <IeltsPartQuestions
          questions={questions}
          sectionId={sectionId}
          answersById={answersById}
          attemptAnswers={attemptAnswers}
          setAnswer={setAnswer}
          submitted={submitted}
          appearance="listening"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:h-full">
      {questions.map((q, i) => {
        if (q.type !== "html_interactive") return null;
        return (
          <div key={q.id} className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0">
            <ListeningHtmlIframeItem
              q={q}
              sectionId={sectionId}
              localN={i + 1}
              attemptAnswers={attemptAnswers}
              setAnswer={setAnswer}
              submitted={submitted}
            />
          </div>
        );
      })}
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
  const listeningSplitLayout = currentGroup === "listening" && currentSectionId !== LEGACY_SINGLE_SECTION_ID;

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

        {/* Listening split: flex-fill + no outer scroll gap; other modes: scroll + dock padding */}
        <div
          className={`min-h-0 flex-1 bg-[var(--background)] px-4 sm:px-6 ${
            listeningSplitLayout
              ? "flex min-h-0 flex-col overflow-hidden pb-14 pt-4"
              : "overflow-y-auto py-5 pb-28 sm:pb-28"
          }`}
        >
          {listeningSplitLayout ? (
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[110rem] flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-stretch lg:gap-8 xl:grid-cols-[minmax(300px,380px)_1fr]">
              <aside className="flex min-h-0 shrink-0 flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
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
              <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0 lg:h-full">
                <ListeningSectionRight
                  questions={currentSectionQuestions}
                  sectionId={currentSectionId}
                  answersById={answersById}
                  attemptAnswers={attempt.answers}
                  setAnswer={setAnswer}
                  submitted={submitted}
                />
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

        {/* Bottom dock: single compact strip (exam rail + timer + actions) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-1px_0_0_var(--border),0_-8px_32px_rgba(28,25,23,0.04)]">
          <div className="mx-auto flex max-w-[100rem] items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
            <Link
              href="/dashboard/my-exams"
              className="flex h-7 shrink-0 items-center whitespace-nowrap rounded-sm px-2 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] sm:h-8 sm:px-2.5 sm:text-xs"
            >
              ← Exams
            </Link>

            <span className="h-5 w-px shrink-0 bg-[var(--border)] sm:h-6" aria-hidden />

            <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-3 pr-1 sm:gap-4">
                {GROUP_ORDER.map((g) => {
                  const secs = sectionByGroup.get(g);
                  if (!secs?.length) return null;
                  return (
                    <div key={g} className="flex items-center gap-1.5">
                      <span
                        className="select-none text-[10px] font-semibold tabular-nums text-[var(--faint)]"
                        title={groupTitle(g)}
                      >
                        {groupRailMarker(g)}
                      </span>
                      <div className="flex items-center gap-0.5">
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
                              className={`flex h-7 items-center gap-1 rounded-sm px-2 text-[11px] font-medium tabular-nums transition sm:h-8 sm:text-xs ${
                                active
                                  ? "bg-[var(--text)] text-[var(--surface)]"
                                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                              }`}
                            >
                              {partButtonLabel(s.id, secs.length)}
                              <span className={active ? "opacity-60" : "opacity-50"}>
                                {done}/{count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <span className="h-4 w-px shrink-0 bg-[var(--border)]" aria-hidden />

                <div className="flex items-center gap-1">
                  <span className="pr-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--faint)]">Q</span>
                  <div className="flex items-center gap-0.5">
                    {currentSectionQuestions.map((q, i) => {
                      const localN = i + 1;
                      const answered = answersById.has(q.id);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => scrollToQuestionInSection(currentSectionId, localN)}
                          className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-sm text-[11px] font-medium tabular-nums transition sm:h-8 sm:min-w-[2rem] sm:text-xs ${
                            answered
                              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                          }`}
                        >
                          {localN}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <span className="hidden h-6 w-px shrink-0 bg-[var(--border)] sm:block" aria-hidden />

            <div
              className="hidden shrink-0 flex-col items-end justify-center leading-none sm:flex"
              title="Listening 30m · Reading 60m · Writing 60m · Speaking 30m"
            >
              <span className="max-w-[7rem] truncate text-right text-[10px] font-medium text-[var(--faint)]">
                {timerHeading}
              </span>
              <span
                className={`mt-0.5 text-base font-semibold tabular-nums tracking-tight ${
                  timeLeft > 0 && timeLeft < 300 ? "text-[var(--danger-text)]" : "text-[var(--text)]"
                }`}
              >
                {formatHms(timeLeft)}
              </span>
              {timeLeft === 0 && !submitted ? (
                <span className="mt-0.5 text-[10px] font-medium text-[var(--danger-text)]">Time up</span>
              ) : null}
            </div>

            <div
              className="flex shrink-0 flex-col items-end justify-center leading-none sm:hidden"
              title="Listening 30m · Reading 60m · Writing 60m · Speaking 30m"
            >
              <span
                className={`text-sm font-semibold tabular-nums ${
                  timeLeft > 0 && timeLeft < 300 ? "text-[var(--danger-text)]" : "text-[var(--text)]"
                }`}
              >
                {formatHms(timeLeft)}
              </span>
            </div>

            <span className="h-5 w-px shrink-0 bg-[var(--border)] sm:h-6" aria-hidden />

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                disabled={submitted}
                onClick={() => setTimerPaused((p) => !p)}
                className="hidden h-8 items-center rounded-sm border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40 sm:inline-flex"
              >
                {timerPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void saveProgress()}
                className="hidden h-8 items-center rounded-sm border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40 sm:inline-flex"
              >
                Save
              </button>
              <button
                type="button"
                disabled={submitted}
                onClick={() => setTimerPaused((p) => !p)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40 sm:hidden"
                aria-label={timerPaused ? "Resume timer" : "Pause timer"}
                title={timerPaused ? "Resume timer" : "Pause timer"}
              >
                {timerPaused ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void saveProgress()}
                className="inline-flex h-7 items-center rounded-sm border border-[var(--border)] px-2 text-[11px] font-medium text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40 sm:hidden"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy || submitted}
                onClick={() => void submit()}
                className="inline-flex h-7 items-center rounded-sm bg-[var(--accent)] px-3 text-[11px] font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:text-xs"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
