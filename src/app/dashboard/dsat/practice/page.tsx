"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { SatExamShell, SatQuestionNavButton } from "@/components/exams/sat-exam/sat-exam-shell";
import { SatChevronDown, SatEliminateIcon } from "@/components/exams/sat-exam/sat-icons";
import { SatMathText } from "@/components/exams/sat-exam/sat-math-text";
import { createSatFullTemplate, createSatVerbalTemplate } from "@/lib/exams/dsat-template";

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function DsatPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-neutral-600">Loading…</div>
      }
    >
      <DsatPracticeContent />
    </Suspense>
  );
}

function DsatPracticeContent() {
  const searchParams = useSearchParams();
  const isMath = searchParams.get("mode") === "math";

  const verbalExam = useMemo(() => createSatVerbalTemplate(), []);
  const fullExam = useMemo(() => createSatFullTemplate(), []);
  const mathModule = useMemo(() => fullExam.modules.find((m) => m.id === "math2") ?? fullExam.modules[0], [fullExam]);

  const questions = useMemo(
    () => (isMath ? mathModule.questions : verbalExam.verbal.questions),
    [isMath, mathModule.questions, verbalExam.verbal.questions],
  );
  const passages = verbalExam.verbal.passages;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeQuestion = questions[Math.min(activeIndex, Math.max(0, questions.length - 1))];
  const activePassage = useMemo(() => {
    if (isMath) return null;
    const pid = "passageId" in activeQuestion ? activeQuestion.passageId : "";
    return passages.find((p) => p.id === pid) ?? passages[0];
  }, [isMath, activeQuestion, passages]);

  const [selected, setSelected] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const duration = isMath ? mathModule.durationSeconds : verbalExam.durationSeconds;
  const [remaining, setRemaining] = useState(duration);
  const [leftHidden, setLeftHidden] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [crossedOut, setCrossedOut] = useState<Record<string, Record<number, boolean>>>({});

  useEffect(() => {
    setActiveIndex(0);
    setRemaining(duration);
    setTimerHidden(false);
    setLeftHidden(false);
  }, [isMath, duration]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setRemaining((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const answeredCount = useMemo(
    () => questions.filter((q) => selected[q.id] !== null && selected[q.id] !== undefined).length,
    [questions, selected],
  );

  function goto(delta: number) {
    setActiveIndex((i) => {
      const next = i + delta;
      if (next < 0) return 0;
      if (next >= questions.length) return questions.length - 1;
      return next;
    });
  }

  function toggleCrossOut(idx: number) {
    setCrossedOut((prev) => {
      const row = { ...(prev[activeQuestion.id] ?? {}) };
      row[idx] = !row[idx];
      return { ...prev, [activeQuestion.id]: row };
    });
  }

  const timeLabel = isMath && timerHidden ? "–:–" : formatTime(remaining);

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
        ) : null}
        <p className="text-[11px] font-medium tabular-nums text-neutral-500">
          {answeredCount}/{questions.length} answered
        </p>
      </div>
    ) : null;

  const questionBody = (
    <>
      <div className="text-[15px] font-normal leading-relaxed text-black">
        {isMath ? <SatMathText text={activeQuestion.question} /> : <p className="whitespace-pre-wrap">{activeQuestion.question}</p>}
      </div>
      <div className="mt-5 space-y-2.5">
        {activeQuestion.choices.map((choice, idx) => {
          const checked = selected[activeQuestion.id] === idx;
          const letter = String.fromCharCode(65 + idx);
          const struck = Boolean(crossedOut[activeQuestion.id]?.[idx]);
          return (
            <div key={`${activeQuestion.id}_${idx}`} className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [activeQuestion.id]: idx }))}
                className={`flex min-h-[48px] w-full items-center gap-3 rounded-md border bg-white px-4 py-3 text-left text-[15px] transition ${
                  checked ? "ring-1 ring-black" : "hover:bg-neutral-50"
                } ${struck ? "opacity-55" : ""}`}
                style={{ borderColor: "#d1d1d1" }}
              >
                <span className={`shrink-0 font-semibold text-black ${struck ? "line-through" : ""}`}>{letter}:</span>
                <span className={`min-w-0 flex-1 text-black ${struck ? "line-through" : ""}`}>
                  {isMath ? <SatMathText text={choice} /> : choice}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleCrossOut(idx)}
                aria-label="Eliminate choice"
                title="Eliminate"
                className="inline-flex w-10 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              >
                <SatEliminateIcon />
              </button>
            </div>
          );
        })}
      </div>
    </>
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
        sectionMetaLine={isMath ? "Section 2, Module 2:" : undefined}
        sectionSubject={isMath ? "Math" : undefined}
        questionNumber={activeIndex + 1}
        markedForReview={Boolean(marked[activeQuestion.id])}
        onToggleMark={() => setMarked((m) => ({ ...m, [activeQuestion.id]: !m[activeQuestion.id] }))}
        footerQuestionNav={
          <SatQuestionNavButton current={activeIndex + 1} total={questions.length}>
            <select
              className="max-w-[100px] cursor-pointer appearance-none bg-transparent pr-1 text-[13px] font-semibold text-white outline-none"
              value={activeIndex}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              aria-label="Jump to question"
            >
              {questions.map((q, i) => (
                <option key={q.id} value={i} className="bg-neutral-900 text-white">
                  {i + 1}
                </option>
              ))}
            </select>
            <SatChevronDown className="h-3 w-3 shrink-0 text-white" />
          </SatQuestionNavButton>
        }
        onBack={() => goto(-1)}
        onNext={() => goto(1)}
        backDisabled={activeIndex === 0}
        nextDisabled={activeIndex === questions.length - 1}
      >
        {questionBody}
      </SatExamShell>
    </RoleGuard>
  );
}
