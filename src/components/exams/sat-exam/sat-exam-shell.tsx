"use client";

import type { ReactNode } from "react";
import { SatDashedRule } from "./dashed-rule";
import {
  SatCalculatorIcon,
  SatChevronDown,
  SatPencilAnnotate,
  SatReferenceIcon,
} from "./sat-icons";

export type SatExamShellVariant = "verbal" | "math";

type SatExamShellProps = {
  variant: SatExamShellVariant;
  timeLabel: string;
  onHideClick: () => void;
  hideToggleLabel: string;

  showPassageColumn: boolean;
  passageColumn?: ReactNode;

  sectionMetaLine?: string;
  sectionSubject?: string;

  questionNumber: number;
  markedForReview: boolean;
  onToggleMark: () => void;
  markDisabled?: boolean;

  children: ReactNode;

  footerQuestionNav: ReactNode;

  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;

  topBanner?: ReactNode;
};

const COL_BORDER = "#d1d1d1";
const BAR_BG = "#f0f0f0";
const BLUE_NEXT = "#007aff";
const BLUE_BACK_VERBAL = "#b3d7ff";
const FOOTER_NAV = "#2d2d2d";

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="h-4 w-4 fill-current text-black" viewBox="0 0 24 24" aria-hidden>
        <path d="M6 2h12v20l-6-4-6 4V2z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
    </svg>
  );
}

function QuestionToolbar({
  questionNumber,
  markedForReview,
  markDisabled,
  onToggleMark,
}: {
  questionNumber: number;
  markedForReview: boolean;
  markDisabled?: boolean;
  onToggleMark: () => void;
}) {
  return (
    <div className="flex shrink-0 items-stretch" style={{ backgroundColor: BAR_BG }}>
      <div
        className="flex w-9 shrink-0 items-center justify-center text-[13px] font-bold leading-none text-white sm:w-10"
        style={{ backgroundColor: "#000" }}
      >
        {questionNumber}
      </div>
      <button
        type="button"
        disabled={markDisabled}
        onClick={onToggleMark}
        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left hover:bg-black/[0.03] disabled:opacity-60"
      >
        <BookmarkIcon filled={markedForReview} />
        <span className="text-[13px] font-normal text-black">Mark for Review</span>
      </button>
    </div>
  );
}

export function SatExamShell({
  variant,
  timeLabel,
  onHideClick,
  hideToggleLabel,
  showPassageColumn,
  passageColumn,
  sectionMetaLine,
  sectionSubject,
  questionNumber,
  markedForReview,
  onToggleMark,
  markDisabled,
  children,
  footerQuestionNav,
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  topBanner,
}: SatExamShellProps) {
  const isMath = variant === "math";

  const body = (
    <>
      {topBanner}

      <SatDashedRule />

      <header className="shrink-0 px-5 pb-3 pt-4 sm:px-8 sm:pb-4 sm:pt-5">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div className="min-w-0 justify-self-start">
            {isMath ? (
              <div className="space-y-0.5">
                {sectionMetaLine ? (
                  <p className="text-[13px] font-normal leading-tight tracking-tight text-black">{sectionMetaLine}</p>
                ) : null}
                {sectionSubject ? <p className="text-xl font-bold leading-tight tracking-tight text-black">{sectionSubject}</p> : null}
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-[13px] font-normal text-black hover:opacity-80"
                >
                  Directions
                  <SatChevronDown className="h-2.5 w-2.5 text-black" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[13px] font-normal text-black hover:opacity-80"
              >
                Directions
                <SatChevronDown className="h-2.5 w-2.5 text-black" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-self-center px-2">
            <span className="text-[22px] font-bold tabular-nums tracking-tight text-black">{timeLabel}</span>
            <button
              type="button"
              onClick={onHideClick}
              className="mt-1 rounded-full border px-3 py-0.5 text-[11px] font-semibold leading-snug text-black hover:bg-neutral-50"
              style={{ borderColor: COL_BORDER }}
            >
              {hideToggleLabel}
            </button>
          </div>

          <div className="justify-self-end">
            {isMath ? (
              <div className="flex gap-6 sm:gap-8">
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-center hover:opacity-80"
                  aria-label="Calculator"
                >
                  <SatCalculatorIcon className="h-6 w-6 text-black" />
                  <span className="text-[11px] font-normal leading-none text-black">Calculator</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-center hover:opacity-80"
                  aria-label="Reference"
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <SatReferenceIcon className="text-[15px]" />
                  </span>
                  <span className="text-[11px] font-normal leading-none text-black">Reference</span>
                </button>
              </div>
            ) : (
              <button type="button" className="flex flex-col items-center gap-1 hover:opacity-80" aria-label="Annotate">
                <SatPencilAnnotate className="h-6 w-6 text-black" />
                <span className="text-[11px] font-normal leading-none text-black">Annotate</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <SatDashedRule />

      <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-5 sm:px-8">
        {isMath ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden border bg-white" style={{ borderColor: COL_BORDER }}>
              <QuestionToolbar
                questionNumber={questionNumber}
                markedForReview={markedForReview}
                markDisabled={markDisabled}
                onToggleMark={onToggleMark}
              />
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">{children}</div>
            </div>
          </div>
        ) : (
          <div className={`grid min-h-0 flex-1 ${showPassageColumn ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {showPassageColumn ? (
              <>
                <div
                  className="min-h-0 overflow-y-auto border-b lg:border-b-0 lg:border-r"
                  style={{ borderColor: COL_BORDER }}
                >
                  <div className="px-4 py-5 sm:px-6 sm:py-6">{passageColumn}</div>
                </div>
                <div className="flex min-h-0 flex-col overflow-hidden lg:border-l" style={{ borderColor: COL_BORDER }}>
                  <QuestionToolbar
                    questionNumber={questionNumber}
                    markedForReview={markedForReview}
                    markDisabled={markDisabled}
                    onToggleMark={onToggleMark}
                  />
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">{children}</div>
                </div>
              </>
            ) : (
              <div className="col-span-full flex min-h-0 flex-col overflow-hidden">
                <div className="flex shrink-0 flex-col border" style={{ borderColor: COL_BORDER }}>
                  <QuestionToolbar
                    questionNumber={questionNumber}
                    markedForReview={markedForReview}
                    markDisabled={markDisabled}
                    onToggleMark={onToggleMark}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto border border-t-0 px-4 py-5 sm:px-6 sm:py-6" style={{ borderColor: COL_BORDER }}>
                  {children}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <SatDashedRule />

      <footer className="shrink-0 px-5 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <div className="w-24 shrink-0 sm:w-32" />
          <div className="flex min-w-0 flex-1 justify-center">{footerQuestionNav}</div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={backDisabled}
              className="rounded-lg px-5 py-2 text-[13px] font-semibold shadow-sm disabled:opacity-40 sm:px-7 sm:py-2.5"
              style={{
                backgroundColor: isMath ? BLUE_NEXT : BLUE_BACK_VERBAL,
                color: isMath ? "#fff" : "#003a80",
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-lg px-5 py-2 text-[13px] font-semibold text-white shadow-sm disabled:opacity-40 sm:px-7 sm:py-2.5"
              style={{ backgroundColor: BLUE_NEXT }}
            >
              Next
            </button>
          </div>
        </div>
      </footer>
    </>
  );

  const column = (
    <div className={`flex flex-col bg-white text-black antialiased ${isMath ? "min-h-0 flex-1" : "min-h-dvh"}`}>{body}</div>
  );

  if (!isMath) {
    return column;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#c4c4c4] px-2 py-3 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col sm:max-w-[1200px]">
        <div
          className="relative flex flex-1 flex-col overflow-hidden rounded-[18px] border border-[#a3a3a3] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.15)] sm:rounded-[22px]"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-10 h-2.5 w-14 -translate-x-1/2 rounded-b-md bg-neutral-900 sm:h-3 sm:w-16"
            aria-hidden
          />
          {column}
        </div>
      </div>
    </div>
  );
}

export function SatQuestionNavButton({
  current,
  total,
  children,
}: {
  current: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div
      className="inline-flex max-w-full items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold text-white sm:px-4 sm:py-2.5"
      style={{ backgroundColor: FOOTER_NAV }}
    >
      <span className="shrink-0 tabular-nums">
        Question {current} of {total}
      </span>
      {children}
    </div>
  );
}
