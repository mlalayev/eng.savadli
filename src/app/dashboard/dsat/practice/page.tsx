"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { createSatVerbalTemplate } from "@/lib/exams/dsat-template";

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function DsatPracticePage() {
  const exam = useMemo(() => createSatVerbalTemplate(), []);
  const questions = exam.verbal.questions;
  const passages = exam.verbal.passages;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeQuestion = questions[Math.min(activeIndex, Math.max(0, questions.length - 1))];
  const activePassage = passages.find((p) => p.id === activeQuestion.passageId) ?? passages[0];

  const [selected, setSelected] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(exam.durationSeconds);
  const [leftHidden, setLeftHidden] = useState(false);

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

  return (
    <RoleGuard allow={["student"]}>
      <div className="min-h-[calc(100vh-56px)] bg-[var(--background)]">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
            >
              Directions <span className="text-[10px] text-[var(--muted)]">▼</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold tabular-nums text-[var(--text)]">{formatTime(remaining)}</span>
              <button
                type="button"
                onClick={() => setLeftHidden((v) => !v)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
              >
                {leftHidden ? "Show" : "Hide"}
              </button>
            </div>

            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
              aria-label="Annotate"
              title="Annotate"
            >
              ✎
            </button>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-0 px-4 py-4 lg:grid-cols-2">
          {!leftHidden ? (
            <section className="min-h-[70vh] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm lg:rounded-r-none lg:border-r-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                    {exam.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">Passage</p>
                </div>
                <div className="text-xs font-semibold text-[var(--muted)]">
                  {answeredCount}/{questions.length} answered
                </div>
              </div>

              <div className="mt-4 space-y-4 text-sm leading-6 text-[var(--text)]">
                {activePassage?.intros?.length ? (
                  <div className="space-y-2">
                    {activePassage.intros.map((line, idx) => (
                      <p key={`${activePassage.id}_intro_${idx}`} className="font-medium text-[var(--muted)]">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}

                {activePassage?.text?.length ? (
                  <div className="space-y-3">
                    {activePassage.text.map((para, idx) => (
                      <p key={`${activePassage.id}_text_${idx}`} className="whitespace-pre-wrap">
                        {para}
                      </p>
                    ))}
                  </div>
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
                  />
                  Mark for Review
                </label>
              </div>
              <div className="text-xs font-semibold text-[var(--muted)] tabular-nums">
                {activeIndex + 1} / {questions.length}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[var(--text)]">{activeQuestion.question}</p>

              <div className="mt-4 space-y-2">
                {activeQuestion.choices.map((choice, idx) => {
                  const checked = selected[activeQuestion.id] === idx;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={`${activeQuestion.id}_${idx}`}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, [activeQuestion.id]: idx }))}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                        checked
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]"
                          : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:bg-[var(--hover)]"
                      }`}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            checked ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--hover-strong)] text-[var(--text)]"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="min-w-0">{choice}</span>
                      </span>
                      <span className="text-xs font-semibold text-[var(--muted)]">{checked ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
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

