"use client";

import { useId, useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/cn";

export type FAQItem = {
  question: string;
  answer: string;
};

export type FAQProps = {
  items: readonly FAQItem[];
  id?: string;
  title?: string;
  subtitle?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0 text-[var(--faint)] transition duration-200", open && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FAQ({
  items,
  id = "faq",
  title = "Common questions",
  subtitle = "Quick answers before you get started.",
}: FAQProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-[720px] px-4 sm:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">{title}</h2>
          <p className="mt-3 text-base text-[var(--muted)]">{subtitle}</p>
        </FadeIn>

        <div className="mt-10 space-y-2">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const triggerId = `${baseId}-trigger-${index}`;

            return (
              <FadeIn key={item.question} delay={index * 0.05}>
                <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[15px] font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]/50"
                  >
                    {item.question}
                    <Chevron open={open} />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        className="border-t border-[var(--border)] bg-[var(--surface-sunken)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]"
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
