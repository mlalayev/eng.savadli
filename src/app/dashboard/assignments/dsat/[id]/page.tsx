"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { SatExamShell, type SatNavigatorItem } from "@/components/exams/sat-exam/sat-exam-shell";
import { SatEliminateIcon } from "@/components/exams/sat-exam/sat-icons";
import { SatMathText } from "@/components/exams/sat-exam/sat-math-text";
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

function dsatModuleLabel(sectionId: string): string {
  if (sectionId === "rw1") return "Verbal Module 1";
  if (sectionId === "rw2") return "Verbal Module 2";
  if (sectionId === "math1") return "Math Module 1";
  if (sectionId === "math2") return "Math Module 2";
  return "Verbal Module 1";
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
  const [timerHidden, setTimerHidden] = useState(false);
  const [crossedOut, setCrossedOut] = useState<Record<string, Record<number, boolean>>>({});

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

  useEffect(() => {
    setTimerHidden(false);
  }, [activeSectionId]);

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


  const activeQuestion = sectionQuestions[Math.min(activeIndex, Math.max(0, sectionQuestions.length - 1))];

  const passageId =
    assignment?.exam.structure?.questionPassageBySection?.[activeSectionId]?.[activeQuestion?.id ?? ""] ?? "";
  const activePassage =
    (assignment?.exam.structure?.passagesBySection?.[activeSectionId] ?? []).find((p) => p.id === passageId) ??
    (assignment?.exam.structure?.passagesBySection?.[activeSectionId] ?? [])[0] ??
    null;

  const selectedIndex = activeQuestion ? answersById.get(activeQuestion.id) : undefined;

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
  const isMath = activeSectionId.startsWith("math");
  const moduleLabel = dsatModuleLabel(activeSectionId);

  const timeLabel = isMath && timerHidden ? "–:–" : formatTime(remaining);

  const navigatorItems: SatNavigatorItem[] = sectionQuestions.map((q) => ({
    answered: answersById.has(q.id),
    marked: Boolean(marked[q.id]),
  }));

  function toggleCrossOut(idx: number) {
    if (submitted) return;
    setCrossedOut((prev) => {
      const row = { ...(prev[activeQuestion.id] ?? {}) };
      row[idx] = !row[idx];
      return { ...prev, [activeQuestion.id]: row };
    });
  }

  const passageNode =
    !isMath && activePassage ? (
      <div className="space-y-5 text-[15px] leading-7 text-black">
        {activePassage.intros?.length ? (
          <div className="space-y-2">
            {activePassage.intros.map((line, idx) => (
              <p key={`${activePassage.id}_intro_${idx}`} className="font-medium text-neutral-700">
                {line}
              </p>
            ))}
          </div>
        ) : null}
        {activePassage.text?.length ? (
          <div className="space-y-4">
            {activePassage.text.map((para, idx) => (
              <p key={`${activePassage.id}_text_${idx}`} className="whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">No passage configured for this question.</p>
        )}
      </div>
    ) : null;

  const questionBody =
    activeQuestion.type === "mcq_single" ? (
      <>
        <div className="text-[15px] font-normal leading-relaxed text-black">
          {isMath ? (
            <SatMathText text={activeQuestion.prompt} />
          ) : (
            <p className="whitespace-pre-wrap">{activeQuestion.prompt}</p>
          )}
        </div>
        <div className="mt-5 space-y-2.5">
          {normalizeExamChoices(activeQuestion.choices as unknown).map((c, idx) => {
            const checked = Number(selectedIndex) === idx;
            const letter = String.fromCharCode(65 + idx);
            const struck = Boolean(crossedOut[activeQuestion.id]?.[idx]);
            return (
              <div key={c.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswer(activeQuestion.id, idx)}
                  className={`flex min-h-[48px] w-full items-center gap-3 rounded-lg border bg-white px-4 py-3 text-left text-[15px] transition ${
                    checked ? "ring-1 ring-black" : "hover:bg-neutral-50"
                  } ${struck ? "opacity-55" : ""} ${submitted ? "opacity-95" : ""}`}
                  style={{ borderColor: "#d1d1d1" }}
                >
                  <span className={`shrink-0 font-semibold text-black ${struck ? "line-through" : ""}`}>{letter}:</span>
                  <span className={`min-w-0 flex-1 text-black ${struck ? "line-through" : ""}`}>
                    {isMath ? <SatMathText text={choiceDisplayText(c)} /> : choiceDisplayText(c)}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => toggleCrossOut(idx)}
                  aria-label="Eliminate choice"
                  title="Eliminate"
                  className="inline-flex w-10 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40"
                >
                  <SatEliminateIcon />
                </button>
              </div>
            );
          })}
        </div>
      </>
    ) : (
      <p className="text-sm text-neutral-500">This DSAT view currently supports MCQ only.</p>
    );

  return (
    <RoleGuard allow={["student"]}>
      <SatExamShell
        variant={isMath ? "math" : "verbal"}
        timeLabel={timeLabel}
        onHideClick={() => {
          if (isMath) setTimerHidden((v) => !v);
          else setLeftHidden((v) => !v);
        }}
        hideToggleLabel={isMath ? (timerHidden ? "Show" : "Hide") : leftHidden ? "Show" : "Hide"}
        showPassageColumn={!isMath && !leftHidden}
        passageColumn={passageNode}
        moduleLabel={moduleLabel}
        questionNumber={activeIndex + 1}
        markedForReview={Boolean(marked[activeQuestion.id])}
        onToggleMark={() =>
          setMarked((m) => ({
            ...m,
            [activeQuestion.id]: !m[activeQuestion.id],
          }))
        }
        markDisabled={submitted}
        topBanner={
          error ? (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
          ) : undefined
        }
        navigatorItems={navigatorItems}
        onJumpTo={(idx) => setActiveIndex(idx)}
        onBack={() => goto(-1)}
        onNext={() => goto(1)}
        backDisabled={activeIndex === 0}
        nextDisabled={activeIndex >= sectionQuestions.length - 1}
      >
        {questionBody}
      </SatExamShell>
    </RoleGuard>
  );
}

