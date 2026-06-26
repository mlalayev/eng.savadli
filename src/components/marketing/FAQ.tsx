"use client";

import { useId, useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  LANDING_CONTAINER,
  LANDING_SCROLL_MT,
  LANDING_SECTION_PY,
  SectionHeader,
} from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type FAQItem = { question: string; answer: string };

export function FAQ({
  items,
  id = "faq",
  title = "Common questions",
  subtitle = "Quick answers before you get started.",
}: {
  items: readonly FAQItem[];
  id?: string;
  title?: string;
  subtitle?: string;
}) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id={id} className={cn(LANDING_SCROLL_MT, LANDING_SECTION_PY, "bg-[var(--background)]")}>
      <div className={cn(LANDING_CONTAINER, "max-w-3xl")}>
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="mt-14 space-y-3">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const triggerId = `${baseId}-trigger-${index}`;

            return (
              <FadeIn key={item.question} delay={index * 0.04}>
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[0.9375rem] font-semibold text-[var(--text)] transition hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/30"
                  >
                    {item.question}
                    <svg
                      className={cn("h-5 w-5 shrink-0 text-[var(--faint)] transition", open && "rotate-180")}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-[var(--border)] px-6 py-5 text-sm leading-relaxed text-[var(--muted)]">
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
