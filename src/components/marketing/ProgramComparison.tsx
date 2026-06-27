"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import {
  LANDING_SCROLL_MT,
  SectionHeader,
} from "@/components/marketing/Section";
import type { ComparisonCell, ComparisonRow } from "@/lib/programs-page";
import { cn } from "@/lib/cn";

function ComparisonMark({ value }: { value: ComparisonCell }) {
  if (value === "no") {
    return (
      <span className="inline-block h-px w-3 bg-[var(--faint)]" aria-hidden />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full",
        value === "best" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--accent)]",
      )}
      aria-label={value === "best" ? "Best fit" : "Supported"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export type ProgramComparisonProps = {
  rows: readonly ComparisonRow[];
  id?: string;
};

export function ProgramComparison({ rows, id = "compare" }: ProgramComparisonProps) {
  return (
    <FadeIn>
      <div id={id} className={LANDING_SCROLL_MT}>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Program comparison by learning goal</caption>
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="px-6 py-5 text-sm font-semibold text-[var(--text)] sm:px-8">
                  Goal
                </th>
                <th scope="col" className="px-4 py-5 text-center text-sm font-semibold text-[var(--text)] sm:px-6">
                  IELTS
                </th>
                <th scope="col" className="px-4 py-5 text-center text-sm font-semibold text-[var(--text)] sm:px-6">
                  Digital SAT
                </th>
                <th scope="col" className="px-4 py-5 text-center text-sm font-semibold text-[var(--text)] sm:px-6">
                  General English
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.goal}
                  className={cn(index < rows.length - 1 && "border-b border-[var(--border)]")}
                >
                  <th scope="row" className="px-6 py-5 text-sm font-medium text-[var(--text)] sm:px-8">
                    {row.goal}
                  </th>
                  <td className="px-4 py-5 text-center sm:px-6">
                    <ComparisonMark value={row.ielts} />
                  </td>
                  <td className="px-4 py-5 text-center sm:px-6">
                    <ComparisonMark value={row.dsat} />
                  </td>
                  <td className="px-4 py-5 text-center sm:px-6">
                    <ComparisonMark value={row.general} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--faint)]">
          Highlighted checks indicate the strongest fit for each goal.
        </p>
      </div>
    </FadeIn>
  );
}

export function ProgramComparisonSection({
  rows,
  id = "compare",
}: ProgramComparisonProps) {
  return (
    <>
      <SectionHeader
        eyebrow="Compare"
        title="Find the right program for your goal."
        subtitle="Not sure where to start? Use this guide to match your objective with the best track."
      />
      <ProgramComparison rows={rows} id={id} />
    </>
  );
}
