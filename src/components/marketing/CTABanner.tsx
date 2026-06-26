"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { ArrowRightIcon, Button } from "@/components/ui/Button";
import {
  LANDING_CONTAINER,
  LANDING_SCROLL_MT,
  LANDING_SECTION_PY,
  SectionHeader,
} from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export type CTABannerProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  finePrint?: string;
  className?: string;
};

export function CTABanner({
  id = "cta",
  title = "Start preparing with clarity.",
  subtitle = "Join students and teachers who use Savadli to study with structure — from first lesson to exam day.",
  primaryHref = "/login",
  primaryLabel = "Get Started",
  secondaryHref = "/contact",
  secondaryLabel = "Talk to us",
  finePrint = "No credit card required for placement.",
  className,
}: CTABannerProps) {
  return (
    <section
      id={id}
      className={cn(
        LANDING_SCROLL_MT,
        "relative overflow-hidden border-t border-[var(--border)] bg-[var(--background)]",
        LANDING_SECTION_PY,
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 75%)",
        }}
        aria-hidden
      />

      <div className={LANDING_CONTAINER}>
        <SectionHeader title={title} subtitle={subtitle} className="max-w-2xl" />

        <FadeIn delay={0.1} className="mt-10 flex flex-col items-center">
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
            <p className="mt-6 text-center text-xs leading-5 text-[var(--faint)]">{finePrint}</p>
          ) : null}
        </FadeIn>
      </div>
    </section>
  );
}
