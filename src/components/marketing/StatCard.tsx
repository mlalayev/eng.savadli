"use client";

import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  LANDING_CONTAINER,
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  LANDING_SECTION_PY,
  SectionHeader,
} from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type StatCardProps = {
  value: string;
  label: string;
  className?: string;
};

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={cn("text-center", className)}>
      <AnimatedNumber
        value={value}
        className="font-mono text-[2.5rem] font-semibold leading-none tracking-tight text-[var(--footer-heading)] sm:text-5xl"
      />
      <p className="mt-3 text-sm leading-5 text-[var(--footer-text)]">{label}</p>
    </div>
  );
}

export type StatisticsSectionProps = {
  stats: readonly { value: string; label: string }[];
  footnote?: string;
  id?: string;
};

export function StatisticsSection({ stats, footnote, id }: StatisticsSectionProps) {
  return (
    <section id={id} className="bg-[var(--footer-bg)] text-[var(--footer-text)]">
      <div className={cn(LANDING_CONTAINER, LANDING_SECTION_PY)}>
        <SectionHeader
          variant="dark"
          eyebrow="Impact"
          title="Built for outcomes that compound."
          subtitle="Structured preparation — measured in real progress, not streaks."
        />
        <div className={cn(LANDING_HEADER_TO_CONTENT, "grid grid-cols-2", LANDING_GRID_GAP, "lg:grid-cols-4")}>
          {stats.map((stat) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
        {footnote ? (
          <FadeIn delay={0.15}>
            <p className="mt-12 text-center text-xs leading-5 text-[var(--footer-text)] opacity-75">
              {footnote}
            </p>
          </FadeIn>
        ) : null}
      </div>
    </section>
  );
}
