"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { LANDING_SCROLL_MT, SectionHeader } from "@/components/marketing/Section";
import type { PricingComparisonRow, PricingFeatureValue } from "@/lib/pricing-page";
import { cn } from "@/lib/cn";

function FeatureMark({ value }: { value: PricingFeatureValue }) {
  if (value === "no") {
    return <span className="inline-block h-px w-3 bg-[var(--faint)]" aria-hidden />;
  }

  if (value === "limited") {
    return (
      <span className="text-xs font-medium text-[var(--muted)]" aria-label="Limited">
        Limited
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center text-[var(--accent)]"
      aria-label="Included"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export type PricingComparisonProps = {
  rows: readonly PricingComparisonRow[];
  id?: string;
};

export function PricingComparison({ rows, id = "compare" }: PricingComparisonProps) {
  return (
    <FadeIn>
      <div id={id} className={LANDING_SCROLL_MT}>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Pricing plan feature comparison</caption>
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="px-6 py-5 text-sm font-semibold text-[var(--text)] sm:px-8">
                  Feature
                </th>
                <th scope="col" className="px-4 py-5 text-center text-sm font-semibold text-[var(--text)] sm:px-6">
                  Free
                </th>
                <th scope="col" className="px-4 py-5 text-center text-sm font-semibold text-[var(--text)] sm:px-6">
                  Standard
                </th>
                <th scope="col" className="px-4 py-5 text-center text-sm font-semibold text-[var(--text)] sm:px-6">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.feature}
                  className={cn(index < rows.length - 1 && "border-b border-[var(--border)]")}
                >
                  <th scope="row" className="px-6 py-5 text-sm font-medium text-[var(--text)] sm:px-8">
                    {row.feature}
                  </th>
                  <td className="px-4 py-5 text-center sm:px-6">
                    <FeatureMark value={row.free} />
                  </td>
                  <td className="px-4 py-5 text-center sm:px-6">
                    <FeatureMark value={row.standard} />
                  </td>
                  <td className="px-4 py-5 text-center sm:px-6">
                    <FeatureMark value={row.premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FadeIn>
  );
}

export function PricingComparisonSection({ rows, id = "compare" }: PricingComparisonProps) {
  return (
    <>
      <SectionHeader
        eyebrow="Compare"
        title="Compare every feature."
        subtitle="See exactly what each plan includes — no hidden surprises."
      />
      <PricingComparison rows={rows} id={id} />
    </>
  );
}
