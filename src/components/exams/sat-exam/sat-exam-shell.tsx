"use client";

import { Children, type ReactNode } from "react";
import { SatAnnotateIcon, SatBookmarkIcon, SatCalculatorIcon, SatChevronDown, SatReferenceIcon } from "./sat-icons";

const satUiFont = 'Arial, "Helvetica Neue", Helvetica, system-ui, sans-serif';

function SatDashRule({ variant }: { variant: "verbal" | "math" }) {
  const background =
    variant === "verbal"
      ? "repeating-linear-gradient(90deg, #CCCCCC 0px 14px, #ADD8E6 14px 22px, #FFFACD 22px 32px)"
      : "repeating-linear-gradient(90deg, #CCCCCC 0px 16px, #FFD700 16px 22px, #007AFF 22px 30px)";
  return <div className="h-[3px] w-full shrink-0" style={{ background }} aria-hidden />;
}

export function SatQuestionNavButton({
  total,
  children,
}: {
  current: number;
  total: number;
  children: ReactNode;
}) {
  const parts = Children.toArray(children);
  const selectEl = parts[0];
  const chevronEl = parts.slice(1);

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-[#2a2a2a] px-3.5 py-2 text-[13px] font-semibold tracking-tight text-white shadow-sm"
      style={{ fontFamily: satUiFont }}
    >
      <span>Question</span>
      <span className="inline-flex items-center">{selectEl}</span>
      <span className="whitespace-nowrap">of {total}</span>
      {chevronEl}
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
  sectionMetaLine?: string;
  sectionSubject?: string;
  questionNumber: number;
  markedForReview: boolean;
  onToggleMark: () => void;
  markDisabled?: boolean;
  topBanner?: ReactNode;
  footerQuestionNav: ReactNode;
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
  sectionMetaLine,
  sectionSubject,
  questionNumber,
  markedForReview,
  onToggleMark,
  markDisabled,
  topBanner,
  footerQuestionNav,
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  children,
}: SatExamShellProps) {
  const isMath = variant === "math";
  const backBg = isMath ? "#007AFF" : "#7EA5F3";
  const nextBg = isMath ? "#007AFF" : "#0066FF";

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
            {isMath && sectionMetaLine ? (
              <div className="space-y-0.5">
                <p className="text-[13px] font-normal leading-snug text-black">{sectionMetaLine}</p>
                {sectionSubject ? <p className="text-[17px] font-bold leading-tight text-black">{sectionSubject}</p> : null}
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-[13px] font-normal text-black hover:opacity-80"
                >
                  Directions
                  <SatChevronDown className="h-3 w-3 text-neutral-700" />
                </button>
              </div>
            ) : (
              <button type="button" className="inline-flex items-center gap-1 text-[13px] font-normal text-black hover:opacity-80">
                Directions
                <SatChevronDown className="h-3 w-3 text-neutral-700" />
              </button>
            )}
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
          <div className="pointer-events-auto">{footerQuestionNav}</div>
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
    </div>
  );
}
