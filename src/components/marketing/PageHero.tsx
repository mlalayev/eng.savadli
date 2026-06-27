"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { ArrowRightIcon, Button } from "@/components/ui/Button";
import { LANDING_CONTAINER } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("border-b border-[var(--border)] bg-[var(--background)]", className)}>
      <div className={cn(LANDING_CONTAINER, "py-16 sm:py-20 lg:py-24")}>
        <FadeIn className="max-w-2xl">
          {eyebrow ? (
            <p className="text-[13px] font-medium tracking-wide text-[var(--accent)]">{eyebrow}</p>
          ) : null}
          <h1
            className={cn(
              "text-balance text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text)] sm:text-[2.75rem] lg:text-[3.25rem]",
              eyebrow && "mt-3",
            )}
          >
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-[1.0625rem] leading-8 text-[var(--muted)] sm:text-lg">
            {description}
          </p>
          {primaryHref && primaryLabel ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={primaryHref} variant="primary" size="lg" className="w-full sm:w-auto">
                {primaryLabel}
                <ArrowRightIcon />
              </Button>
              {secondaryHref && secondaryLabel ? (
                <Button href={secondaryHref} variant="outline" size="lg" className="w-full sm:w-auto">
                  {secondaryLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </FadeIn>
      </div>
    </section>
  );
}
