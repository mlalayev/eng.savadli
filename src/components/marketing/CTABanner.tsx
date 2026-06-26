"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { ArrowRightIcon, Button } from "@/components/ui/Button";
import {
  LANDING_CONTAINER,
  LANDING_SCROLL_MT,
  LANDING_SECTION_PY,
  SectionHeader,
} from "@/components/marketing/Section";

export type CTABannerProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  finePrint?: string;
};

export function CTABanner({
  id = "cta",
  title = "Start preparing with confidence.",
  subtitle = "Join hundreds of students using Savadli to reach their target scores — with structure, not stress.",
  primaryHref = "/login",
  primaryLabel = "Get Started",
  secondaryHref = "/contact",
  secondaryLabel = "Talk to us",
  finePrint = "No credit card required to create an account.",
}: CTABannerProps) {
  return (
    <section
      id={id}
      className={`${LANDING_SCROLL_MT} ${LANDING_SECTION_PY} border-t border-[var(--border)] bg-[var(--card)]`}
    >
      <div className={LANDING_CONTAINER}>
        <SectionHeader title={title} subtitle={subtitle} />
        <FadeIn delay={0.08} className="mt-12 flex flex-col items-center">
          <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href={primaryHref} variant="primary" size="lg" className="w-full sm:w-auto">
              {primaryLabel}
              <ArrowRightIcon />
            </Button>
            <Button href={secondaryHref} variant="outline" size="lg" className="w-full sm:w-auto">
              {secondaryLabel}
            </Button>
          </div>
          {finePrint ? (
            <p className="mt-6 text-center text-xs text-[var(--faint)]">{finePrint}</p>
          ) : null}
        </FadeIn>
      </div>
    </section>
  );
}
