"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  SatAnnotateIcon,
  SatBookmarkIcon,
  SatCalculatorIcon,
  SatChevronDown,
  SatChevronUp,
  SatCloseIcon,
  SatReferenceIcon,
} from "./sat-icons";

const satUiFont = 'Arial, "Helvetica Neue", Helvetica, system-ui, sans-serif';

function SatDashRule({ variant }: { variant: "verbal" | "math" }) {
  const background =
    variant === "verbal"
      ? "repeating-linear-gradient(90deg, #CCCCCC 0px 14px, #ADD8E6 14px 22px, #FFFACD 22px 32px)"
      : "repeating-linear-gradient(90deg, #CCCCCC 0px 16px, #FFD700 16px 22px, #007AFF 22px 30px)";
  return <div className="h-[3px] w-full shrink-0" style={{ background }} aria-hidden />;
}

export type SatNavigatorItem = {
  answered: boolean;
  marked: boolean;
};

type QuestionNavigatorModalProps = {
  open: boolean;
  onClose: () => void;
  moduleLabel: string;
  currentIndex: number;
  items: SatNavigatorItem[];
  onJumpTo: (index: number) => void;
};

function QuestionNavigatorModal({
  open,
  onClose,
  moduleLabel,
  currentIndex,
  items,
  onJumpTo,
}: QuestionNavigatorModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rows: number[][] = [];
  for (let i = 0; i < items.length; i += 10) {
    rows.push(Array.from({ length: Math.min(10, items.length - i) }, (_, j) => i + j));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal style={{ fontFamily: satUiFont }}>
      <button
        type="button"
        aria-label="Close question navigator"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[640px] rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-black">{moduleLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-black"
          >
            <SatCloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-2 pt-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-dashed border-neutral-300 pb-3 text-[12px] text-neutral-700">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-dashed border-black bg-white" aria-hidden />
              Current
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-neutral-500 bg-white" aria-hidden />
              Unanswered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-[#1d4ed8] bg-[#1d4ed8]" aria-hidden />
              Answered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <SatBookmarkIcon className="h-3.5 w-3.5 fill-[#b91c1c] text-[#b91c1c]" />
              For Review
            </span>
          </div>
        </div>

        <div className="space-y-2 px-5 pb-4 pt-3">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-neutral-500">No questions in this module.</p>
          ) : (
            rows.map((row, ri) => (
              <div
                key={ri}
                className={`flex flex-wrap gap-2 ${row.length < 10 ? "justify-center" : "justify-start"}`}
              >
                {row.map((idx) => {
                  const item = items[idx];
                  const isCurrent = idx === currentIndex;
                  const base = "relative flex h-9 w-9 items-center justify-center rounded-md text-[13px] font-semibold tabular-nums transition";
                  const stateClass = isCurrent
                    ? "border border-dashed border-black bg-white text-black"
                    : item.answered
                      ? "border border-[#1d4ed8] bg-[#1d4ed8] text-white hover:bg-[#1e40af]"
                      : "border border-neutral-400 bg-white text-black hover:border-black";
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onJumpTo(idx);
                        onClose();
                      }}
                      className={`${base} ${stateClass}`}
                    >
                      {idx + 1}
                      {item.marked ? (
                        <SatBookmarkIcon className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-[#b91c1c] text-[#b91c1c] drop-shadow" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type SatExamShellProps = {
  variant: "verbal" | "math";
  timeLabel: string;
  onHideClick: () => void;
  hideToggleLabel: string;
  showPassageColumn: boolean;
  passageColumn?: ReactNode;
  /** Top-of-page label, e.g. "Math Module 1" or "Verbal Module 2". */
  moduleLabel: string;
  questionNumber: number;
  markedForReview: boolean;
  onToggleMark: () => void;
  markDisabled?: boolean;
  topBanner?: ReactNode;
  /** Items powering the question navigator modal (length = total questions in module). */
  navigatorItems: SatNavigatorItem[];
  onJumpTo: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  backDisabled: boolean;
  nextDisabled: boolean;
  children: ReactNode;
};

export function SatExamShell({
  variant,
  timeLabel,
  onHideClick,
  hideToggleLabel,
  showPassageColumn,
  passageColumn,
  moduleLabel,
  questionNumber,
  markedForReview,
  onToggleMark,
  markDisabled,
  topBanner,
  navigatorItems,
  onJumpTo,
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  children,
}: SatExamShellProps) {
  const isMath = variant === "math";
  const backBg = isMath ? "#007AFF" : "#7EA5F3";
  const nextBg = isMath ? "#007AFF" : "#0066FF";
  const totalQuestions = navigatorItems.length;

  const [navOpen, setNavOpen] = useState(false);

  const questionChrome = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[#d8d8d8] bg-[#e8e8e8] px-3">
        <div
          className="flex h-[26px] min-w-[26px] items-center justify-center bg-black px-1.5 text-[12px] font-semibold leading-none text-white"
          aria-hidden
        >
          {questionNumber}
        </div>
        <button
          type="button"
          disabled={markDisabled}
          onClick={onToggleMark}
          aria-pressed={markedForReview}
          className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)] transition disabled:cursor-not-allowed disabled:opacity-45 ${
            markedForReview
              ? "border-[#b91c1c] bg-[#fff1f1] text-[#b91c1c]"
              : "border-[#c4c4c4] bg-white text-black hover:bg-neutral-50"
          }`}
        >
          <SatBookmarkIcon
            className={`h-4 w-4 ${markedForReview ? "fill-[#b91c1c] text-[#b91c1c]" : "text-neutral-700"}`}
          />
          Mark for Review
        </button>
      </div>
      <SatDashRule variant={variant} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">{children}</div>
      <SatDashRule variant={variant} />
    </div>
  );

  return (
    <div
      className="flex h-dvh min-h-0 flex-col bg-white text-black antialiased"
      style={{ fontFamily: satUiFont }}
    >
      {topBanner}

      <header className="shrink-0 px-6 pb-3 pt-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div className="min-w-0 justify-self-start">
            <p className="text-[15px] font-semibold leading-tight text-black">{moduleLabel}</p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1 text-[13px] font-normal text-black hover:opacity-80"
            >
              Directions
              <SatChevronDown className="h-3 w-3 text-neutral-700" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <div className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-black">{timeLabel}</div>
            <button
              type="button"
              onClick={onHideClick}
              className="rounded-full border border-[#c8c8c8] bg-white px-3.5 py-1 text-[11px] font-medium text-black shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:bg-neutral-50"
            >
              {hideToggleLabel}
            </button>
          </div>

          <div className="min-w-0 justify-self-end">
            {isMath ? (
              <div className="flex items-start gap-6 pr-1 pt-0.5">
                <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-normal text-black hover:opacity-80">
                  <SatCalculatorIcon className="h-6 w-6 text-neutral-800" />
                  Calculator
                </button>
                <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-normal text-black hover:opacity-80">
                  <SatReferenceIcon className="h-6 w-6 text-neutral-800" />
                  Reference
                </button>
              </div>
            ) : (
              <button type="button" className="flex flex-col items-center gap-1 pr-1 pt-0.5 text-[11px] font-normal text-black hover:opacity-80">
                <SatAnnotateIcon className="h-6 w-6 text-neutral-800" />
                Annotate
              </button>
            )}
          </div>
        </div>
      </header>

      <SatDashRule variant={variant} />

      <main className="min-h-0 flex-1 overflow-hidden">
        {isMath ? (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[720px] flex-col px-6">{questionChrome}</div>
        ) : showPassageColumn ? (
          <div className="grid h-full min-h-0 grid-cols-2 divide-x divide-[#e2e2e2]">
            <div className="min-h-0 overflow-y-auto px-8 py-6">{passageColumn}</div>
            <div className="flex h-full min-h-0 min-w-0 flex-col">{questionChrome}</div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col px-8">{questionChrome}</div>
        )}
      </main>

      <footer className="relative flex h-[72px] shrink-0 items-center px-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={navOpen}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2 text-[13px] font-semibold tracking-tight text-white shadow-sm transition hover:bg-black"
          >
            <span>
              Question {questionNumber} of {totalQuestions}
            </span>
            {navOpen ? (
              <SatChevronUp className="h-3 w-3 text-white" />
            ) : (
              <SatChevronDown className="h-3 w-3 text-white" />
            )}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={backDisabled}
            className="rounded-full px-7 py-2.5 text-[13px] font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: backBg }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="rounded-full px-7 py-2.5 text-[13px] font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: nextBg }}
          >
            Next
          </button>
        </div>
      </footer>

      <QuestionNavigatorModal
        open={navOpen}
        onClose={() => setNavOpen(false)}
        moduleLabel={moduleLabel}
        currentIndex={questionNumber - 1}
        items={navigatorItems}
        onJumpTo={onJumpTo}
      />
    </div>
  );
}
