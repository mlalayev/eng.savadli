"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { LANDING_HEADER_TO_CONTENT, Section, SectionHeader } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type ContentSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  paragraphs: readonly string[];
  tone?: "default" | "muted";
  align?: "left" | "center";
  className?: string;
};

export function ContentSection({
  id,
  eyebrow,
  title,
  paragraphs,
  tone = "default",
  align = "left",
  className,
}: ContentSectionProps) {
  const centered = align === "center";

  return (
    <Section id={id} tone={tone} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} align={align} />
      <FadeIn className={cn(LANDING_HEADER_TO_CONTENT, centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl")}>
        <div className="space-y-5">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-pretty text-[1.0625rem] leading-8 text-[var(--muted)] sm:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}
