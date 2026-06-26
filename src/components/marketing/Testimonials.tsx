"use client";

import { Card } from "@/components/ui/Card";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import {
  LANDING_CONTAINER,
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  LANDING_SECTION_PY,
  SectionHeader,
} from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
  initials: string;
};

export function Testimonials({
  items,
  title = "What students say",
  subtitle = "Real preparation takes time. Here is what learners report after studying on Savadli.",
}: {
  items: readonly Testimonial[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className={cn(LANDING_SECTION_PY, "bg-[var(--background)]")}>
      <div className={LANDING_CONTAINER}>
        <SectionHeader title={title} subtitle={subtitle} />
        <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "md:grid-cols-3")}>
          {items.map((item) => (
            <StaggerItem key={item.name}>
              <Card interactive variant="muted" padding="lg" className="flex h-full flex-col">
                <blockquote className="flex-1 text-pretty text-base leading-7 text-[var(--text)]">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <footer className="mt-8 border-t border-[var(--border)] pt-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background)] text-xs font-semibold text-[var(--muted)]"
                      aria-hidden
                    >
                      {item.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{item.name}</p>
                      <p className="text-xs text-[var(--muted)]">{item.meta}</p>
                    </div>
                  </div>
                </footer>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
