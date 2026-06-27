"use client";

import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { LANDING_HEADER_TO_CONTENT } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type FlowStep = {
  step: string;
  description?: string;
};

export type PracticeFlowProps = {
  steps: readonly FlowStep[];
  className?: string;
};

export function PracticeFlow({ steps, className }: PracticeFlowProps) {
  return (
    <div className={cn(LANDING_HEADER_TO_CONTENT, "mx-auto max-w-md", className)}>
      <FadeIn className="hidden md:block">
        <ol className="relative">
          {steps.map((item, index) => (
            <li key={item.step} className="relative flex flex-col items-center text-center">
              <div className="flex w-full flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                </div>
                <p className="mt-4 text-base font-semibold text-[var(--text)]">{item.step}</p>
                {item.description ? (
                  <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
                ) : null}
              </div>
              {index < steps.length - 1 ? (
                <p className="py-5 text-[var(--faint)]" aria-hidden>
                  ↓
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </FadeIn>

      <Stagger className="space-y-3 md:hidden">
        {steps.map((item, index) => (
          <StaggerItem key={item.step}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
              <p className="font-semibold text-[var(--text)]">{item.step}</p>
              {item.description ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
              ) : null}
            </div>
            {index < steps.length - 1 ? (
              <p className="py-1 text-center text-[var(--faint)]" aria-hidden>
                ↓
              </p>
            ) : null}
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
