"use client";

import { Card } from "@/components/ui/Card";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import {
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  LANDING_SECTION_PY,
  LANDING_CONTAINER,
  SectionHeader,
} from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
  initials: string;
};

export type TestimonialsProps = {
  items: readonly Testimonial[];
  title?: string;
  subtitle?: string;
};

export function Testimonials({
  items,
  title = "Students who stuck with the process",
  subtitle = "Real preparation takes time — here's what learners say about studying on Savadli.",
}: TestimonialsProps) {
  return (
    <section className={cn(LANDING_SECTION_PY, "bg-[var(--background)]")}>
      <div className={LANDING_CONTAINER}>
        <SectionHeader title={title} subtitle={subtitle} />
        <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "md:grid-cols-3")}>
          {items.map((item) => (
            <StaggerItem key={item.name}>
              <TestimonialCard {...item} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, name, meta, initials }: Testimonial) {
  return (
    <Card interactive padding="lg" className="flex h-full flex-col">
      <blockquote className="flex-1 text-pretty text-[1.0625rem] leading-7 text-[var(--text)]">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <footer className="mt-8 border-t border-[var(--border)] pt-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-xs font-semibold text-[var(--muted)]"
            aria-hidden
          >
            {initials}
          </div>
          <div>
            <cite className="not-italic">
              <p className="text-sm font-semibold text-[var(--text)]">{name}</p>
            </cite>
            <p className="text-xs leading-4 text-[var(--muted)]">{meta}</p>
          </div>
        </div>
      </footer>
    </Card>
  );
}
