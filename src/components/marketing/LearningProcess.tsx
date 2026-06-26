"use client";

import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";
import {
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { LEARNING_STEPS } from "@/lib/marketing";
import { cn } from "@/lib/cn";

export function LearningProcess() {
  return (
    <Section id="practice">
      <SectionHeader
        eyebrow="How it works"
        title="A clear path from enrollment to exam day."
        subtitle="Every step is designed — no guessing what comes next."
      />

      <div className={cn(LANDING_HEADER_TO_CONTENT, "mx-auto max-w-lg")}>
        <FadeIn className="hidden md:block">
          <ol className="relative space-y-0">
            {LEARNING_STEPS.map((item, index) => (
              <li key={item.step} className="relative flex gap-6 pb-10 last:pb-0">
                {index < LEARNING_STEPS.length - 1 ? (
                  <div
                    className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[var(--border)]"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                </div>
                <div className="pt-0.5">
                  <p className="text-base font-semibold text-[var(--text)]">{item.step}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </FadeIn>

        <Stagger className="space-y-3 md:hidden">
          {LEARNING_STEPS.map((item, index) => (
            <StaggerItem key={item.step}>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-semibold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-[var(--text)]">{item.step}</p>
                </div>
                <p className="mt-2 pl-10 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
              </div>
              {index < LEARNING_STEPS.length - 1 ? (
                <p className="py-1 text-center text-[var(--faint)]" aria-hidden>
                  ↓
                </p>
              ) : null}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
