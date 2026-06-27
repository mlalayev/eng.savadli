"use client";

import { ArrowRightIcon, Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import type { ProgramAccent } from "@/components/marketing/ProgramCard";
import { ProgramIcon } from "@/components/marketing/ProgramCard";
import { LANDING_SCROLL_MT } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type ProgramDetailCardProps = {
  id: string;
  accent: ProgramAccent;
  title: string;
  summary: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  className?: string;
};

export function ProgramDetailCard({
  id,
  accent,
  title,
  summary,
  features,
  ctaLabel,
  ctaHref,
  className,
}: ProgramDetailCardProps) {
  return (
    <article id={id} className={cn(LANDING_SCROLL_MT, className)}>
      <Card variant="muted" padding="lg" className="flex h-full flex-col">
        <ProgramIcon accent={accent} />
        <CardTitle className="mt-6 text-xl">{title}</CardTitle>
        <CardDescription className="mt-2 text-[0.9375rem] leading-7">{summary}</CardDescription>
        <ul className="mt-6 flex-1 space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-[var(--muted)]">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button href={ctaHref} variant="primary" size="md" className="w-full sm:w-auto">
            {ctaLabel}
            <ArrowRightIcon />
          </Button>
        </div>
      </Card>
    </article>
  );
}
